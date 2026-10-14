import React from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { Typography, Spacing, Radii } from '../../../theme';
import { ContentCaptureColors as D } from './tokens';
import { useTranslation } from 'react-i18next';

interface TranscriptBoxProps {
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  editable?: boolean;
}

/** Live transcript / notes box shown while a story is being recorded. */
export const TranscriptBox: React.FC<TranscriptBoxProps> = ({
  value,
  onChangeText,
  placeholder,
  editable = true,
}) => {
  const { t } = useTranslation('contentCapture');
  return (
  <TextInput
    style={s.box}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder ?? t('transcript.placeholder')}
    placeholderTextColor={D.onSurfaceVariant}
    multiline
    editable={editable}
    textAlignVertical="top"
    accessibilityLabel={t('transcript.label')}
  />
  );
};

const s = StyleSheet.create({
  box: {
    minHeight: 220,
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    padding: Spacing.md,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: D.onSurface,
    lineHeight: 24,
  },
});

export default TranscriptBox;
