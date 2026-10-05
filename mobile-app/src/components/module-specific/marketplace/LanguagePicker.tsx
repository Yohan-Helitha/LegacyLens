import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  LANGUAGE_OPTIONS,
  PROFICIENCY_OPTIONS,
  setLanguageLevel,
  toggleLanguage,
} from '../../../utils/creatorLanguages';
import type { LanguageSelection } from '../../../utils/creatorLanguages';
import { CheckboxRow, RadioRow } from './OptionRows';

/**
 * Sinhala / Tamil / English tick-boxes; ticking one reveals Basic /
 * Intermediate / Fluent under it. One component for the "Become a Content
 * Creator" form and for a creator changing their languages later, so both
 * look and behave the same.
 */
export const LanguagePicker: React.FC<{
  value: LanguageSelection;
  onChange: (next: LanguageSelection) => void;
}> = ({ value, onChange }) => (
  <View>
    {LANGUAGE_OPTIONS.map((language) => {
      const checked = language in value;
      return (
        <View key={language}>
          <CheckboxRow label={language} checked={checked} onToggle={() => onChange(toggleLanguage(value, language))} />
          {checked && (
            <View style={s.levelGroup}>
              {PROFICIENCY_OPTIONS.map((option) => (
                <RadioRow
                  key={option.value}
                  label={option.label}
                  selected={value[language] === option.value}
                  onSelect={() => onChange(setLanguageLevel(value, language, option.value))}
                />
              ))}
            </View>
          )}
        </View>
      );
    })}
  </View>
);

const s = StyleSheet.create({
  // Level choices sit under their language, indented past the checkbox.
  levelGroup: { marginLeft: 36 },
});

export default LanguagePicker;
