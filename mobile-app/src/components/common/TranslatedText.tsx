import React from 'react';
import { Text, View } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import { useTranslatedTexts } from '../../hooks/useTranslatedTexts';
import { TranslationToggle } from './TranslationToggle';

interface TranslatedTextProps {
  text: string | null | undefined;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  /** Set false to translate silently, with no "Show original" link (e.g. in tight list rows). */
  showToggle?: boolean;
}

/** A <Text> that shows user-written content in the elder's language, with a "Show original" link when it was translated. */
export const TranslatedText: React.FC<TranslatedTextProps> = ({ text, style, numberOfLines, showToggle = true }) => {
  const { texts, translated, showOriginal, toggleOriginal } = useTranslatedTexts([text]);

  return (
    <View>
      <Text style={style} numberOfLines={numberOfLines}>
        {texts[0]}
      </Text>
      {showToggle && translated && <TranslationToggle showOriginal={showOriginal} onPress={toggleOriginal} />}
    </View>
  );
};

export default TranslatedText;
