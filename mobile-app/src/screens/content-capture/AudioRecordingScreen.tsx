import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Pause, Play } from 'lucide-react-native';
import { RoundIconButton } from '../../components/common';
import {
  ContentCaptureTopBar,
  MicOrb,
  RecordingActionButtons,
  ContentCaptureColors as D,
} from '../../components/module-specific/content-capture';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { Typography, Spacing, Radii } from '../../theme';

interface AudioRecordingScreenProps {
  onClose?: () => void;
  /** User tapped "Use this recording" — clip is stopped, saved to disk, ready to attach */
  onFinish?: (result: { uri: string; durationMillis: number }) => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const BAR_COUNT = 5;

/**
 * Dedicated audio-only recording screen — no video preview, no mode
 * toggle. Recording starts automatically on mount, matching the mic tap
 * that brought the elder here from ChooseCaptureMethodScreen.
 */
export const AudioRecordingScreen: React.FC<AudioRecordingScreenProps> = ({ onClose, onFinish }) => {
  const { state, elapsedMs, start, pause, resume, stop, restart } = useAudioRecorder();
  const isPaused = state === 'paused';
  const isRecording = state === 'recording';

  const barAnims = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.3))).current;

  useEffect(() => {
    start();
    // Intentionally runs once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isRecording) {
      barAnims.forEach((value) => value.stopAnimation());
      return;
    }
    const loops = barAnims.map((value, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, { toValue: 1, duration: 420 + i * 80, useNativeDriver: false }),
          Animated.timing(value, { toValue: 0.25, duration: 420 + i * 80, useNativeDriver: false }),
        ]),
      ),
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [isRecording, barAnims]);

  const handlePauseToggle = () => (isPaused ? resume() : pause());

  const handleFinish = async () => {
    const result = await stop();
    if (result) onFinish?.(result);
  };

  const pauseLabel = isPaused ? 'Paused, tap to resume' : 'Recording, tap to pause';

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
          <MicOrb active={!isPaused} accessibilityLabel={pauseLabel} />
          <View style={{ width: 48 }} />
        </View>

        <RecordingActionButtons
          startOverLabel="Start Over"
          finishLabel="Use this recording"
          onStartOverPress={restart}
          onFinishPress={handleFinish}
        />
      </View>
    </SafeAreaView>
  );
};

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
  timer: { fontFamily: Typography.fontDisplay, fontSize: 40, color: D.primary, letterSpacing: 1 },
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

export default AudioRecordingScreen;
