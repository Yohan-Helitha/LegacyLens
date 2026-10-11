import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  useAudioRecorder as useExpoAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { speechApi } from '../services/api/speechApi';
import { ApiError } from '../services/api/client';
import type { TranscriptionResponse } from '../types/speech';

export type VoiceInputState =
  | 'idle'
  | 'requestingPermission'
  | 'preparing'
  | 'recording'
  | 'uploading'
  | 'done'
  | 'error';

export type VoiceInputErrorKind = 'permission' | 'tooShort' | 'network' | 'server' | 'unauthorized' | 'unknown';

/** Record-then-transcribe, capped at 30s — see section 2/7.1 of the Sinhala voice-typing prompt this hook implements. */
const MAX_RECORDING_MS = 30000;
/** Below this, the clip is discarded instead of uploaded — not worth a round trip, and Azure may reject it outright. */
const MIN_RECORDING_MS = 1000;
/**
 * Protects the first spoken words (see section 2's measured "first 1–2
 * seconds sometimes not transcribed"): the recorder is already running
 * underneath, but the UI only tells the elder to start speaking — and our
 * own elapsed/auto-stop timer only starts — after this delay past the
 * recorder's own confirmed start.
 */
const START_CUE_DELAY_MS = 500;
const COUNTDOWN_WARNING_AT_SECONDS = 5;

interface UseVoiceInputOptions {
  /** BCP-47 tag sent to the backend; defaults to the backend's own default (si-LK). */
  language?: string;
}

/**
 * The recording + upload + transcription state machine behind the
 * Azure-backed voice capture flow. UI-free by design — see
 * VoiceCaptureField for the component that renders this.
 *
 * Deliberately separate from useAudioRecorder/useVoiceToText: those back
 * the already-shipped recording screens and on-device dictation, which this
 * feature does not touch. The states this hook needs (requestingPermission
 * as its own step, a post-upload done/error split, no pause/resume) don't
 * fit either of those hooks' shapes, so duplicating a small amount of
 * expo-audio setup here was judged safer than reshaping a hook three other
 * screens already depend on.
 */
export function useVoiceInput({ language }: UseVoiceInputOptions = {}) {
  const recorder = useExpoAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);

  const [state, setState] = useState<VoiceInputState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [result, setResult] = useState<TranscriptionResponse | null>(null);
  const [errorKind, setErrorKind] = useState<VoiceInputErrorKind | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cueTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Guards against a stop()/cancel() racing the 500ms start cue — see start(). */
  const cancelledDuringCueRef = useRef(false);
  /**
   * The last successfully recorded clip. Kept around (not cleared on a
   * network/server error) so retryUpload() can re-send it — per spec 7.2:
   * "On network failure or a 5xx, keep the recorded file and offer Try
   * again without re-recording." Cleared once the upload succeeds or the
   * elder abandons the attempt via retry()/cancel().
   */
  const lastRecordingRef = useRef<{ uri: string; durationMs: number } | null>(null);
  /**
   * Bumped by resetToIdle() — every cancel()/retry()/start() passes through
   * it. uploadAndScore captures the current value before awaiting the
   * network call and checks it's unchanged before applying its result,
   * so a cancel mid-upload can't have a late response resurrect state
   * after the elder has already moved on (e.g. tapped "Start Over").
   */
  const attemptIdRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (cueTimeoutRef.current) clearTimeout(cueTimeoutRef.current);
    tickRef.current = null;
    cueTimeoutRef.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const resetToIdle = useCallback(() => {
    clearTimers();
    cancelledDuringCueRef.current = false;
    lastRecordingRef.current = null;
    attemptIdRef.current += 1;
    setState('idle');
    setElapsedSeconds(0);
    setResult(null);
    setErrorKind(null);
    setErrorMessage(null);
  }, [clearTimers]);

  // Auto-stop (once elapsedSeconds reaches the cap) is handled by the effect
  // below, which watches this same counter — keeping the tick itself a plain increment.
  const beginCountdown = useCallback(() => {
    setElapsedSeconds(0);
    tickRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, []);

  const uploadAndScore = useCallback(
    async (uri: string, recordedMs: number) => {
      if (recordedMs < MIN_RECORDING_MS) {
        setState('error');
        setErrorKind('tooShort');
        setErrorMessage('That was too short. Please try again.');
        return;
      }

      const attemptId = attemptIdRef.current;
      lastRecordingRef.current = { uri, durationMs: recordedMs };
      setState('uploading');
      AccessibilityInfo.announceForAccessibility('Writing it down, please wait');
      try {
        const response = await speechApi.transcribe(uri, language);
        if (attemptIdRef.current !== attemptId) return; // cancelled/reset while this was in flight — drop it.
        lastRecordingRef.current = null;
        setResult(response);
        setState('done');
        AccessibilityInfo.announceForAccessibility(
          response.qualityHint === 'NO_SPEECH_DETECTED'
            ? "We couldn't hear anything."
            : 'Done. Please review the text.',
        );
      } catch (err) {
        if (attemptIdRef.current !== attemptId) return; // same — nothing to show, the attempt is gone.
        setState('error');
        if (err instanceof ApiError) {
          if (err.status === 401) {
            setErrorKind('unauthorized');
            setErrorMessage('Please sign in again to keep using voice typing.');
          } else if (err.status != null && err.status >= 500) {
            setErrorKind('server');
            setErrorMessage(err.message);
          } else if (err.status == null) {
            setErrorKind('network');
            setErrorMessage(err.message);
          } else {
            setErrorKind('unknown');
            setErrorMessage(err.message);
          }
        } else {
          setErrorKind('unknown');
          setErrorMessage('Something went wrong. Please try again.');
        }
      }
    },
    [language],
  );

  const stop = useCallback(async () => {
    // Racing the start cue — let start() see this and skip arming the recording state.
    if (state === 'preparing') {
      cancelledDuringCueRef.current = true;
      return;
    }
    if (state !== 'recording') return;

    clearTimers();
    // The recorder's own reported duration, not our cue-based elapsedSeconds
    // counter — this includes the brief pre-cue warm-up too, which only
    // makes the too-short check more lenient, never less.
    const recordedMs = recorderState.durationMillis;
    // Matches useAudioRecorder's own pattern: recorder.uri is read after
    // stop() resolves, not before — the file write isn't guaranteed final until then.
    await recorder.stop();
    const uri = recorder.uri;

    if (!uri) {
      setState('error');
      setErrorKind('unknown');
      setErrorMessage("Couldn't save that recording. Please try again.");
      return;
    }

    await uploadAndScore(uri, recordedMs);
  }, [state, recorder, recorderState.durationMillis, clearTimers, uploadAndScore]);

  // Auto-stop once the countdown reaches the cap.
  useEffect(() => {
    if (state === 'recording' && elapsedSeconds >= MAX_RECORDING_MS / 1000) {
      stop();
    }
  }, [state, elapsedSeconds, stop]);

  const start = useCallback(async () => {
    if (state !== 'idle' && state !== 'error') return;

    setErrorKind(null);
    setErrorMessage(null);
    setResult(null);
    cancelledDuringCueRef.current = false;
    setState('requestingPermission');

    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setState('error');
      setErrorKind('permission');
      setErrorMessage('Legacy Lens needs microphone access to turn your voice into text.');
      return;
    }

    setState('preparing');
    await recorder.prepareToRecordAsync();
    recorder.record();

    cueTimeoutRef.current = setTimeout(() => {
      if (cancelledDuringCueRef.current) {
        // stop() was called while we were still waiting out the cue delay — discard immediately.
        recorder.stop().catch(() => {});
        resetToIdle();
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      AccessibilityInfo.announceForAccessibility('Listening');
      setState('recording');
      beginCountdown();
    }, START_CUE_DELAY_MS);
  }, [state, recorder, beginCountdown, resetToIdle]);

  const cancel = useCallback(async () => {
    clearTimers();
    if (state === 'preparing') {
      cancelledDuringCueRef.current = true;
      return;
    }
    if (state === 'recording') {
      await recorder.stop().catch(() => {});
    }
    resetToIdle();
  }, [state, recorder, clearTimers, resetToIdle]);

  /** Discards the clip and returns to idle, ready to record a fresh attempt. */
  const retry = useCallback(() => {
    resetToIdle();
  }, [resetToIdle]);

  /**
   * Re-sends the last recorded clip without re-recording — for network/5xx
   * failures specifically (see lastRecordingRef's own doc comment). Falls
   * back to a full retry() if there's nothing left to resend, e.g. after a
   * permission or too-short error, where nothing was ever uploaded.
   */
  const retryUpload = useCallback(() => {
    const last = lastRecordingRef.current;
    if (!last) {
      retry();
      return;
    }
    uploadAndScore(last.uri, last.durationMs);
  }, [retry, uploadAndScore]);

  const secondsLeft = Math.max(0, MAX_RECORDING_MS / 1000 - elapsedSeconds);
  const showCountdownWarning = state === 'recording' && secondsLeft <= COUNTDOWN_WARNING_AT_SECONDS;

  return {
    state,
    elapsedSeconds,
    secondsLeft,
    showCountdownWarning,
    result,
    errorKind,
    errorMessage,
    start,
    stop,
    cancel,
    retry,
    retryUpload,
  };
}

export default useVoiceInput;
