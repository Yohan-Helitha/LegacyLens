import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Pause, Play, Video as VideoIcon } from 'lucide-react-native';
import { RoundIconButton, SegmentedControl } from '../../components/common';
import {
  ContentCaptureTopBar,
  MicOrb,
  RecordingActionButtons,
  ContentCaptureColors as D,
} from '../../components/module-specific/content-capture';
import { Typography, Spacing, Radii } from '../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface RecordedClip {
  uri: string;
  durationMillis: number;
  kind: 'audio' | 'video';
  /** Only set when the clip came from a device file picker — preserves its real name/type for upload. */
  mimeType?: string;
  fileName?: string;
}

type CaptureMode = 'audio' | 'video';

interface RecordCaptureProps {
  onClose?: () => void;
  /** User tapped Finish — the clip is stopped, saved to disk, and ready to attach */
  onFinish?: (clip: RecordedClip) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const BAR_COUNT = 5;

async function beginAudioRecording(): Promise<Audio.Recording | null> {
  const perm = await Audio.requestPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(
      'Microphone access needed',
      'Legacy Lens needs microphone access to record your story.'
    );
    return null;
  }
  await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
  const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  return recording;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen — live audio or video capture, no transcription, just the clip
// ─────────────────────────────────────────────────────────────────────────────
export const RecordCapture: React.FC<RecordCaptureProps> = ({ onClose, onFinish }) => {
  const [mode, setMode] = useState<CaptureMode>('audio');
  const [isPaused, setIsPaused] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const recordingPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);
  const elapsedMsRef = useRef(0);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const barAnims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.3))
  ).current;

  // Audio auto-starts as soon as the screen mounts, matching the mic press
  // that already happened on the prompt screen. Video needs an explicit tap
  // since the camera preview has to be shown first.
  useEffect(() => {
    let cancelled = false;
    beginAudioRecording().then((recording) => {
      if (cancelled || !recording) return;
      recordingRef.current = recording;
    });
    return () => {
      cancelled = true;
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    };
  }, []);

  // Ask for camera + microphone access as soon as the Video tab is selected.
  useEffect(() => {
    if (mode !== 'video') return;
    if (!cameraPermission?.granted) requestCameraPermission();
    if (!micPermission?.granted) requestMicPermission();
    // Only re-run when the tab itself changes — the permission objects
    // change as a *result* of these calls, so depending on them would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    const active = mode === 'audio' ? !isPaused : isRecordingVideo;
    if (!active) return;
    const interval = setInterval(() => {
      setElapsedMs((ms) => {
        const next = ms + 1000;
        elapsedMsRef.current = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mode, isPaused, isRecordingVideo]);

  useEffect(() => {
    if (mode !== 'audio' || isPaused) {
      barAnims.forEach((value) => value.stopAnimation());
      return;
    }
    const loops = barAnims.map((value, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, { toValue: 1, duration: 420 + i * 80, useNativeDriver: false }),
          Animated.timing(value, { toValue: 0.25, duration: 420 + i * 80, useNativeDriver: false }),
        ])
      )
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [mode, isPaused, barAnims]);

  const resetTimer = () => {
    setElapsedMs(0);
    elapsedMsRef.current = 0;
  };

  // ── Mode switching ──────────────────────────────────────────────────────
  const handleModeChange = async (nextMode: CaptureMode) => {
    if (nextMode === mode) return;

    if (mode === 'audio') {
      const previous = recordingRef.current;
      recordingRef.current = null;
      try {
        await previous?.stopAndUnloadAsync();
      } catch {
        // already stopped — nothing to clean up
      }
    } else if (isRecordingVideo && cameraRef.current) {
      cameraRef.current.stopRecording();
      await recordingPromiseRef.current?.catch(() => {});
      recordingPromiseRef.current = null;
      setIsRecordingVideo(false);
    }

    resetTimer();
    setIsPaused(false);
    setMode(nextMode);

    if (nextMode === 'audio') {
      const fresh = await beginAudioRecording();
      recordingRef.current = fresh;
    }
  };

  // ── Audio controls ──────────────────────────────────────────────────────
  const handlePauseToggle = async () => {
    const recording = recordingRef.current;
    if (!recording) return;
    if (isPaused) {
      await recording.startAsync();
      setIsPaused(false);
    } else {
      await recording.pauseAsync();
      setIsPaused(true);
    }
  };

  const handleStartOverAudio = async () => {
    const previous = recordingRef.current;
    recordingRef.current = null;
    resetTimer();
    setIsPaused(false);
    try {
      await previous?.stopAndUnloadAsync();
    } catch {
      // already stopped — nothing to clean up
    }
    const fresh = await beginAudioRecording();
    recordingRef.current = fresh;
  };

  const handleFinishAudio = async () => {
    const recording = recordingRef.current;
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    recordingRef.current = null;
    if (uri) {
      onFinish?.({ uri, durationMillis: elapsedMs, kind: 'audio' });
    }
  };

  // ── Video controls ──────────────────────────────────────────────────────
  const handleStartVideoRecording = () => {
    if (!cameraRef.current || isRecordingVideo) return;
    resetTimer();
    setIsRecordingVideo(true);
    recordingPromiseRef.current = cameraRef.current.recordAsync();
  };

  const handleStartOverVideo = async () => {
    if (isRecordingVideo && cameraRef.current) {
      cameraRef.current.stopRecording();
      await recordingPromiseRef.current?.catch(() => {});
    }
    recordingPromiseRef.current = null;
    setIsRecordingVideo(false);
    resetTimer();
  };

  const handleFinishVideo = async () => {
    if (!isRecordingVideo || !cameraRef.current) return;
    cameraRef.current.stopRecording();
    const video = await recordingPromiseRef.current?.catch(() => undefined);
    recordingPromiseRef.current = null;
    setIsRecordingVideo(false);
    if (video?.uri) {
      onFinish?.({ uri: video.uri, durationMillis: elapsedMsRef.current, kind: 'video' });
    }
  };

  const handleStartOver = () => (mode === 'audio' ? handleStartOverAudio() : handleStartOverVideo());
  const handleFinish = () => (mode === 'audio' ? handleFinishAudio() : handleFinishVideo());

  const cameraReady = !!cameraPermission?.granted && !!micPermission?.granted;

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <ContentCaptureTopBar left="close" onLeftPress={onClose} />

      <View style={s.content}>
        <SegmentedControl
          tabs={[
            { key: 'audio', label: 'Audio' },
            { key: 'video', label: 'Video' },
          ]}
          active={mode}
          onChange={handleModeChange}
        />

        {mode === 'audio' ? (
          <>
            <Text style={s.instructionText}>
              Speak naturally — we're recording your story, just as you tell it.
            </Text>

            <View style={s.stage}>
              <Text style={s.timer}>{formatDuration(elapsedMs)}</Text>

              <View style={s.bars}>
                {barAnims.map((value, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      s.bar,
                      {
                        height: value.interpolate({ inputRange: [0, 1], outputRange: [10, 48] }),
                        opacity: isPaused ? 0.35 : 1,
                      },
                    ]}
                  />
                ))}
              </View>

              <Text style={s.statusLabel}>{isPaused ? 'Paused' : 'Recording…'}</Text>
            </View>

            <View style={s.controlsRow}>
              <RoundIconButton
                icon={isPaused ? Play : Pause}
                size={48}
                color={D.onSurfaceVariant}
                backgroundColor={D.surfaceContainer}
                onPress={handlePauseToggle}
                accessibilityLabel={isPaused ? 'Resume recording' : 'Pause recording'}
              />
              <MicOrb active={!isPaused} accessibilityLabel="Recording in progress" />
              <View style={{ width: 48 }} />
            </View>
          </>
        ) : (
          <>
            <Text style={s.instructionText}>
              {isRecordingVideo
                ? "Tell your story on camera — tap Finish when you're done."
                : 'Frame your shot, then tap the button to start recording.'}
            </Text>

            <View style={s.stage}>
              {!cameraReady ? (
                <View style={s.permissionBox}>
                  <VideoIcon size={32} color={D.onSurfaceVariant} strokeWidth={2} />
                  <Text style={s.permissionText}>
                    Legacy Lens needs camera and microphone access to record a video story.
                  </Text>
                  <Pressable
                    onPress={() => {
                      requestCameraPermission();
                      requestMicPermission();
                    }}
                    style={({ pressed }) => [s.permissionBtn, pressed && s.pressed]}
                    accessibilityRole="button"
                  >
                    <Text style={s.permissionBtnText}>Grant access</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={s.cameraWrap}>
                  <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} mode="video" facing="back" />

                  <View style={s.timerPill}>
                    {isRecordingVideo && <View style={s.recDot} />}
                    <Text style={s.timerPillText}>{formatDuration(elapsedMs)}</Text>
                  </View>

                  {!isRecordingVideo && (
                    <View style={s.cameraOverlayBottom}>
                      <Pressable
                        onPress={handleStartVideoRecording}
                        style={({ pressed }) => [s.recordBtn, pressed && s.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel="Start recording video"
                      >
                        <View style={s.recordBtnInner} />
                      </Pressable>
                    </View>
                  )}
                </View>
              )}
            </View>
          </>
        )}

        <RecordingActionButtons onStartOverPress={handleStartOver} onFinishPress={handleFinish} />
      </View>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },

  content: { flex: 1, padding: Spacing.md, gap: Spacing.lg },

  instructionText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: D.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
  },

  stage: {
    flex: 1,
    backgroundColor: 'rgba(15,92,92,0.06)',
    borderRadius: Radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,92,92,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
    overflow: 'hidden',
  },
  timer: {
    fontFamily: Typography.fontDisplay,
    fontSize: 40,
    color: D.primary,
    letterSpacing: 1,
  },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 48 },
  bar: { width: 6, borderRadius: 3, backgroundColor: D.secondaryContainer },
  statusLabel: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
    letterSpacing: 0.5,
  },

  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
  },

  // ── Video stage ────────────────────────────────────────────────────────
  cameraWrap: { flex: 1, width: '100%' },
  timerPill: {
    position: 'absolute',
    top: Spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timerPillText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ffffff' },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e0453c' },
  cameraOverlayBottom: {
    position: 'absolute',
    bottom: Spacing.lg,
    alignSelf: 'center',
  },
  recordBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBtnInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#e0453c' },

  permissionBox: { alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.lg },
  permissionText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: D.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: D.primary,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  permissionBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onPrimary },

  pressed: { opacity: 0.85 },
});

export default RecordCapture;
