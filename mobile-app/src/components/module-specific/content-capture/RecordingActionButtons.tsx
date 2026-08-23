import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Typography, Spacing, Radii } from '../../../theme';
import { ContentCaptureColors as D } from './tokens';

interface RecordingActionButtonsProps {
  onStartOverPress?: () => void;
  onFinishPress?: () => void;
}

/** "Start Over" / "Finish" pair shown at the bottom of an active recording session. */
export const RecordingActionButtons: React.FC<RecordingActionButtonsProps> = ({
  onStartOverPress,
  onFinishPress,
}) => (
  <View style={s.row}>
    <Pressable
      onPress={onStartOverPress}
      style={({ pressed }) => [s.outlineBtn, pressed && s.pressed]}
      accessibilityRole="button"
    >
      <Text style={s.outlineBtnText}>Start Over</Text>
    </Pressable>
    <Pressable
      onPress={onFinishPress}
      style={({ pressed }) => [s.fillBtn, pressed && s.pressed]}
      accessibilityRole="button"
    >
      <Text style={s.fillBtnText}>Finish</Text>
    </Pressable>
  </View>
);

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm },
  outlineBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: D.outline,
    borderRadius: Radii.full,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  outlineBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
  },
  fillBtn: {
    flex: 1,
    backgroundColor: D.primary,
    borderRadius: Radii.full,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  fillBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: D.onPrimary,
  },
  pressed: { opacity: 0.85 },
});

export default RecordingActionButtons;
