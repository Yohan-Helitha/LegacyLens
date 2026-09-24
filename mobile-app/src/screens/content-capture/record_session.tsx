import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Pause } from 'lucide-react-native';
import { RoundIconButton } from '../../components/common';
import {
  ContentCaptureTopBar,
  MicOrb,
  TranscriptBox,
  RecordingActionButtons,
  ContentCaptureColors as D,
} from '../../components/module-specific/content-capture';
import { Typography, Spacing } from '../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface RecordSessionProps {
  onClose?: () => void;
  onPausePress?: () => void;
  onStartOver?: () => void;
  onFinish?: (transcript: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const RecordSession: React.FC<RecordSessionProps> = ({
  onClose,
  onPausePress,
  onStartOver,
  onFinish,
}) => {
  const [transcript, setTranscript] = useState('');

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <ContentCaptureTopBar left="close" onLeftPress={onClose} />

      <View style={s.content}>
        <Text style={s.instructionText}>
          Press the mic. Start telling your story. We'll write it down for you.
        </Text>

        <TranscriptBox value={transcript} onChangeText={setTranscript} />

        <View style={s.controlsRow}>
          <RoundIconButton
            icon={Pause}
            size={48}
            color={D.onSurfaceVariant}
            backgroundColor={D.surfaceContainer}
            onPress={onPausePress}
            accessibilityLabel="Pause"
          />
          <MicOrb active accessibilityLabel="Recording in progress" />
          <View style={{ width: 48 }} />
        </View>

        <RecordingActionButtons
          onStartOverPress={onStartOver}
          onFinishPress={() => onFinish?.(transcript)}
        />
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

  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
  },
});

export default RecordSession;
