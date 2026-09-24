import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Mic, Search } from 'lucide-react-native';
import { Radii, Spacing, Typography } from '../../../theme';
import { useVoiceSearch } from '../../../hooks/useVoiceSearch';
import { ContentCaptureColors as D } from './tokens';

interface VoiceSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

/**
 * Search field with a mango-orange microphone inside it — the elder can
 * type, or tap the mic and speak a title or topic instead. Both paths just
 * call onChangeText, so a spoken search behaves exactly like a typed one.
 */
export const VoiceSearchBar: React.FC<VoiceSearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search your stories…',
}) => {
  const { isListening, error, start, stop } = useVoiceSearch({ onResult: onChangeText });

  return (
    <View>
      <View style={[s.wrap, isListening && s.wrapListening]}>
        <Search size={18} color={D.onSurfaceVariant} strokeWidth={2} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={D.onSurfaceVariant}
          style={s.input}
          returnKeyType="search"
        />
        <Pressable
          onPress={isListening ? stop : start}
          style={({ pressed }) => [s.micBtn, isListening && s.micBtnActive, pressed && s.pressed]}
          accessibilityRole="button"
          accessibilityLabel={isListening ? 'Stop voice search' : 'Search by speaking'}
        >
          <Mic size={18} color={isListening ? '#ffffff' : D.onSecondaryContainer} strokeWidth={2} />
        </Pressable>
      </View>

      {isListening && <Text style={s.hint}>Listening…</Text>}
      {!isListening && error && <Text style={s.hintError}>{error}</Text>}
    </View>
  );
};

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.full,
    paddingLeft: Spacing.md,
    paddingRight: 6,
    height: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
  },
  wrapListening: { borderColor: D.secondaryContainer, borderWidth: 1.5 },
  input: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: D.onSurface,
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    backgroundColor: D.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: { backgroundColor: D.secondary },
  pressed: { opacity: 0.85 },

  hint: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeXS,
    color: D.onSecondaryContainer,
    marginTop: 6,
    marginLeft: Spacing.md,
  },
  hintError: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: D.clay,
    marginTop: 6,
    marginLeft: Spacing.md,
  },
});

export default VoiceSearchBar;
