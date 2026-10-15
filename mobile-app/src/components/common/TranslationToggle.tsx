import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, Typography } from '../../theme';

interface TranslationToggleProps {
  showOriginal: boolean;
  onPress: () => void;
  style?: StyleProp<TextStyle>;
}

/** Small "Translated · Show original" link shown under machine-translated content, so the elder can always see what was actually written. */
export const TranslationToggle: React.FC<TranslationToggleProps> = ({ showOriginal, onPress, style }) => {
  const { t } = useTranslation('common');
  const label = showOriginal ? t('translation.showTranslation') : t('translation.showOriginal');
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={8}>
      <Text style={[s.text, style]}>{label}</Text>
    </Pressable>
  );
};

const s = StyleSheet.create({
  text: {
    fontFamily: Typography.fontBody,
    fontSize: 12,
    color: Colors.secondary,
    textDecorationLine: 'underline',
  },
});

export default TranslationToggle;
