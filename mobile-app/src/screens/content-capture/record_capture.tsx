import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import { Pause, Play } from 'lucide-react-native';
import { RoundIconButton } from '../../components/common';
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
}

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

async function beginRecording(): Promise<Audio.Recording | null> {
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
// Main Screen — live audio capture, no transcription, just the recording
// ─────────────────────────────────────────────────────────────────────────────
export const RecordCapture: React.FC<RecordCaptureProps> = ({ onClose, onFinish }) => {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const barAnims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.3))
  ).current;

  // Start recording as soon as the screen mounts (the mic press already happened
  // on the prompt screen — this screen *is* "the mic is on").
  useEffect(() => {
    let cancelled = false;
    beginRecording().then((recording) => {
      if (cancelled || !recording) return;
      recordingRef.current = recording;
    });
    return () => {
      cancelled = true;
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => setElapsedMs((ms) => ms + 1000), 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    if (isPaused) {
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
  }, [isPaused, barAnims]);

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

  const handleStartOver = async () => {
    const previous = recordingRef.current;
    recordingRef.current = null;
    setElapsedMs(0);
    setIsPaused(false);
    try {
      await previous?.stopAndUnloadAsync();
    } catch {
      // already stopped — nothing to clean up
    }
    const fresh = await beginRecording();
    recordingRef.current = fresh;
  };

  const handleFinish = async () => {
    const recording = recordingRef.current;
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    recordingRef.current = null;
    if (uri) {
      onFinish?.({ uri, durationMillis: elapsedMs });
    }
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <ContentCaptureTopBar left="close" onLeftPress={onClose} />

      <View style={s.content}>
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
});

export default RecordCapture;
