import { useCallback, useState } from 'react';
import { AccessibilityInfo, Alert } from 'react-native';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  useAudioRecorder as useExpoAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

export type AudioRecorderState = 'idle' | 'recording' | 'paused' | 'stopped';

/**
 * Audio-only recording — start/pause/resume/stop, elapsed time, and the
 * local file URI once stopped. Uses expo-audio, not expo-av: expo-av is
 * deprecated as of SDK 54 (its own runtime warning says so) and its
 * Android permission request was observed to silently no-op — no system
 * dialog at all — even with RECORD_AUDIO correctly declared in the
 * manifest. expo-audio is the maintained replacement and its
 * requestRecordingPermissionsAsync() triggers the real OS dialog.
 */
export function useAudioRecorder() {
  const recorder = useExpoAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const [state, setState] = useState<AudioRecorderState>('idle');

  const start = useCallback(async () => {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Microphone access needed', 'Legacy Lens needs microphone access to record your story.');
      return;
    }
    await recorder.prepareToRecordAsync();
    recorder.record();
    setState('recording');
    AccessibilityInfo.announceForAccessibility('Recording started');
  }, [recorder]);

  const pause = useCallback(() => {
    if (state !== 'recording') return;
    recorder.pause();
    setState('paused');
  }, [state, recorder]);

  const resume = useCallback(() => {
    if (state !== 'paused') return;
    recorder.record();
    setState('recording');
  }, [state, recorder]);

  /** Stops and returns the local file URI. Null if nothing was recording. */
  const stop = useCallback(async (): Promise<{ uri: string; durationMillis: number } | null> => {
    if (state !== 'recording' && state !== 'paused') return null;
    const durationMillis = recorderState.durationMillis;
    await recorder.stop();
    setState('stopped');
    AccessibilityInfo.announceForAccessibility('Recording stopped');
    return recorder.uri ? { uri: recorder.uri, durationMillis } : null;
  }, [state, recorder, recorderState.durationMillis]);

  /** Discards the current take and starts a fresh one. */
  const restart = useCallback(async () => {
    if (state === 'recording' || state === 'paused') {
      try {
        await recorder.stop();
      } catch {
        // already stopped — nothing to clean up
      }
    }
    setState('idle');
    await start();
  }, [state, recorder, start]);

  return { state, elapsedMs: recorderState.durationMillis, start, pause, resume, stop, restart };
}

export default useAudioRecorder;
