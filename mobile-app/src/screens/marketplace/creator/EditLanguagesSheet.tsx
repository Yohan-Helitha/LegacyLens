import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LanguagePicker } from '../../../components/module-specific/marketplace/LanguagePicker';
import { ApiError } from '../../../services/api/client';
import { creatorApplicationApi } from '../../../services/api/creatorApplicationApi';
import { Typography, Spacing, Radii } from '../../../theme';
import type { CreatorLanguage } from '../../../types/creatorApplication';
import {
  languageMissingLevel,
  toLanguageRequests,
} from '../../../utils/creatorLanguages';
import type { LanguageSelection } from '../../../utils/creatorLanguages';

const C = {
  primary: '#0F5C5C',
  surface: '#EDEFEE',
  card: '#ffffff',
  onSurface: '#202428',
  onSurfaceVariant: '#4a5568',
  danger: '#C0392B',
  divider: '#c8dcdc',
} as const;

/** What the picker starts with: the languages the creator already declared, each with its level. */
function selectionFrom(languages: CreatorLanguage[]): LanguageSelection {
  const selection: LanguageSelection = {};
  for (const entry of languages) {
    selection[entry.language] = entry.proficiency;
  }
  return selection;
}

/**
 * Lets a creator who already applied change which languages they speak and
 * how well - so elders see accurate languages and recommendations use them.
 * Saving never sends the application back for review.
 */
export const EditLanguagesSheet: React.FC<{
  visible: boolean;
  current: CreatorLanguage[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ visible, current, onClose, onSaved }) => {
  const [selection, setSelection] = useState<LanguageSelection>(() => selectionFrom(current));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start from the saved languages each time the sheet is opened.
  React.useEffect(() => {
    if (visible) {
      setSelection(selectionFrom(current));
      setError(null);
    }
  }, [visible, current]);

  const save = async () => {
    if (Object.keys(selection).length === 0) {
      setError('Please select at least one language.');
      return;
    }
    const missing = languageMissingLevel(selection);
    if (missing) {
      setError(`Please choose how well you speak ${missing}.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await creatorApplicationApi.updateLanguages(toLanguageRequests(selection));
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your languages. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <Text style={s.title}>Languages</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={s.closeBtn}>
            <Text style={s.closeText}>Cancel</Text>
          </Pressable>
        </View>

        <View style={s.body}>
          <Text style={s.help}>
            Tick the languages you speak and choose how well. Elders see this when they pick a creator.
          </Text>
          <View style={s.card}>
            <LanguagePicker value={selection} onChange={setSelection} />
          </View>
          {!!error && <Text style={s.error}>{error}</Text>}
        </View>

        <Pressable
          onPress={save}
          disabled={saving}
          style={({ pressed }) => [s.saveBtn, (pressed || saving) && s.saveBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Save languages"
        >
          {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={s.saveText}>Save</Text>}
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.surface, padding: Spacing.md, gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXL, color: C.primary },
  closeBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: Spacing.sm },
  closeText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: C.primary },
  body: { flex: 1, gap: Spacing.md },
  help: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 21, color: C.onSurfaceVariant },
  card: { backgroundColor: C.card, borderRadius: Radii.lg, padding: Spacing.md },
  error: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: C.danger },
  saveBtn: {
    minHeight: 52,
    borderRadius: Radii.full,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnPressed: { opacity: 0.8 },
  saveText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: '#ffffff' },
});

export default EditLanguagesSheet;
