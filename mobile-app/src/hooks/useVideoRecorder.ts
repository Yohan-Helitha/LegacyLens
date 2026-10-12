import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Alert } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';

export type VideoRecorderState = 'idle' | 'recording' | 'stopped';

/**
 * Video-only recording — wraps expo-camera. The CameraView itself must be
 * rendered by the screen (it's a real preview surface, not something a hook
 * can own), so this hook just manages the ref, permissions, and recording
 * lifecycle around it.
 *
 * `cameraReady` tracks the native preview surface's own onCameraReady
 * callback, separately from permission grant state — calling recordAsync()
 * before the surface has actually finished mounting is a known way for it
 * to fail silently on Android, so the record button stays hidden until
 * onCameraReady fires, not just once permissions resolve.
 */
export function useVideoRecorder() {
  const [state, setState] = useState<VideoRecorderState>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [mountError, setMountError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const recordingPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);
  const elapsedMsRef = useRef(0);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  useEffect(() => {
    if (!cameraPermission?.granted) requestCameraPermission();
    if (!micPermission?.granted) requestMicPermission();
    // Ask once on mount only — the permission objects change as a *result*
    // of these calls, so depending on them would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state !== 'recording') return;
    const interval = setInterval(() => {
      setElapsedMs((ms) => {
        const next = ms + 1000;
        elapsedMsRef.current = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state]);

  const handleCameraReady = useCallback(() => {
    setMountError(null);
    setCameraReady(true);
  }, []);

  const handleMountError = useCallback((event: { message?: string }) => {
    setCameraReady(false);
    const message = event?.message || 'The camera failed to start.';
    setMountError(message);
    Alert.alert('Camera error', message);
  }, []);

  const start = useCallback(async () => {
    if (!cameraRef.current || state === 'recording' || !cameraReady) return;
    setElapsedMs(0);
    elapsedMsRef.current = 0;
    setState('recording');
    AccessibilityInfo.announceForAccessibility('Recording started');
    try {
      recordingPromiseRef.current = cameraRef.current.recordAsync();
      const result = await recordingPromiseRef.current;
      if (!result?.uri) {
        // recordAsync resolved with nothing — a silent native failure, or
        // it was stopped from outside without going through stop() below.
        // Surface it rather than leaving the elder stuck on a dead screen.
        Alert.alert('Recording problem', "The recording didn't save properly. Please try again.");
        setState('idle');
      }
    } catch (err) {
      setState('idle');
      Alert.alert(
        'Recording failed',
        err instanceof Error ? err.message : 'Something went wrong starting the recording.',
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraReady]);

  /** Stops and returns the local file URI. Null if nothing was recording. */
  const stop = useCallback(async (): Promise<{ uri: string; durationMillis: number } | null> => {
    if (state !== 'recording' || !cameraRef.current) return null;
    cameraRef.current.stopRecording();
    const video = await recordingPromiseRef.current?.catch((err) => {
      Alert.alert('Recording failed', err instanceof Error ? err.message : 'Something went wrong.');
      return undefined;
    });
    recordingPromiseRef.current = null;
    setState('stopped');
    AccessibilityInfo.announceForAccessibility('Recording stopped');
    return video?.uri ? { uri: video.uri, durationMillis: elapsedMsRef.current } : null;
  }, [state]);

  /** Discards the current take so the elder can start over. */
  const restart = useCallback(async () => {
    if (state === 'recording' && cameraRef.current) {
      cameraRef.current.stopRecording();
      await recordingPromiseRef.current?.catch(() => {});
    }
    recordingPromiseRef.current = null;
    setElapsedMs(0);
    elapsedMsRef.current = 0;
    setState('idle');
  }, [state]);

  const isReady = !!cameraPermission?.granted && !!micPermission?.granted;

  return {
    cameraRef,
    state,
    elapsedMs,
    isReady,
    cameraReady,
    mountError,
    onCameraReady: handleCameraReady,
    onMountError: handleMountError,
    requestPermissions: () => {
      requestCameraPermission();
      requestMicPermission();
    },
    start,
    stop,
    restart,
  };
}

export default useVideoRecorder;
