import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Mic, Pause } from 'lucide-react-native';
import { RoundIconButton, SegmentedControl } from '../../components/common';
import {
  ContentCaptureTopBar,
  MicOrb,
  ContentCaptureColors as D,
} from '../../components/module-specific/content-capture';
import { Typography, Spacing, Radii } from '../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type CaptureMode = 'voice' | 'video';

interface RecordPromptProps {
  onMenuPress?: () => void;
  /** User tapped the mic to begin recording */
  onStartRecording?: (mode: CaptureMode) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const RecordPrompt: React.FC<RecordPromptProps> = ({
  onMenuPress,
  onStartRecording,
}) => {
  const [mode, setMode] = useState<CaptureMode>('voice');

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <ContentCaptureTopBar left="menu" onLeftPress={onMenuPress} />

      <View style={s.content}>
        <View style={s.panel}>
          <SegmentedControl
            tabs={[
              { key: 'voice', label: 'Voice' },
              { key: 'video', label: 'Video' },
            ]}
            active={mode}
            onChange={setMode}
          />

          <View style={s.instructionBlock}>
            <Mic size={28} color={D.onSurfaceVariant} strokeWidth={2} />
            <Text style={s.instructionText}>
              Once you click, start telling your story..
            </Text>
          </View>

          <View style={s.controlsRow}>
            <RoundIconButton
              icon={Pause}
              size={48}
              color={D.onSurfaceVariant}
              backgroundColor={D.surfaceContainer}
              onPress={() => {}}
              accessibilityLabel="Pause"
            />
            <MicOrb onPress={() => onStartRecording?.(mode)} accessibilityLabel="Start recording" />
            <View style={{ width: 48 }} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },

  content: { flex: 1, padding: Spacing.md, justifyContent: 'center' },

  panel: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    padding: Spacing.md,
    gap: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },

  instructionBlock: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  instructionText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: D.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 260,
  },

  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
  },
});

export default RecordPrompt;
