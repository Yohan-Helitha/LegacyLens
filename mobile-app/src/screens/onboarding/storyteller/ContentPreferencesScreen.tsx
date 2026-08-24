import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Check, Mic, Video, FileText } from 'lucide-react-native';
import { BackButton } from '../../../components/common';
import { ApiError } from '../../../services/api/client';
import { Colors, Typography, Spacing, Radii } from '../../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type ContentType = 'video' | 'audio' | 'written';
export type Topic =
  | 'village-dialects'
  | 'industry-words'
  | 'old-stories'
  | 'farming-methods'
  | 'cultural-events'
  | 'other';

export interface StorytellerPreferences {
  contentTypes: ContentType[];
  topics: Topic[];
  otherTopic: string;
}

interface ContentPreferencesScreenProps {
  onBack?: () => void;
  /** Submits the answers (e.g. requests the confirmation OTP). Throw to show the error and let the user retry. */
  onContinue?: (preferences: StorytellerPreferences) => Promise<void>;
}

const CONTENT_TYPE_OPTIONS: { key: ContentType; label: string; icon: typeof Mic }[] = [
  { key: 'video', label: 'Video', icon: Video },
  { key: 'audio', label: 'Audio', icon: Mic },
  { key: 'written', label: 'Written article', icon: FileText },
];

const TOPIC_OPTIONS: { key: Topic; label: string }[] = [
  { key: 'village-dialects', label: 'Village dialects' },
  { key: 'industry-words', label: 'Industry-based words' },
  { key: 'old-stories', label: 'Old stories' },
  { key: 'farming-methods', label: 'Farming methods' },
  { key: 'cultural-events', label: 'Cultural events' },
  { key: 'other', label: 'Other' },
];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// ─────────────────────────────────────────────────────────────────────────────
// Checkbox row — shared visual for both question groups
// ─────────────────────────────────────────────────────────────────────────────
const CheckboxRow: React.FC<{
  label: string;
  checked: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
}> = ({ label, checked, onPress, icon }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="checkbox"
    accessibilityState={{ checked }}
    accessibilityLabel={label}
    style={({ pressed }) => [styles.row, checked && styles.rowChecked, pressed && styles.rowPressed]}
  >
    {icon}
    <Text style={[styles.rowLabel, checked && styles.rowLabelChecked]}>{label}</Text>
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Check size={14} color={Colors.white} strokeWidth={3} />}
    </View>
  </Pressable>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const ContentPreferencesScreen: React.FC<ContentPreferencesScreenProps> = ({
  onBack,
  onContinue,
}) => {
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [otherTopic, setOtherTopic] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canContinue = contentTypes.length > 0 && topics.length > 0;

  const handleContinue = async () => {
    if (!canContinue || submitting) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await onContinue?.({ contentTypes, topics, otherTopic });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor={Colors.dominant} />

      <View style={styles.topBar}>
        <BackButton onPress={onBack} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heading}>
          <Text style={styles.headline}>Tell us about your stories</Text>
          <Text style={styles.subheadline}>
            This helps us match you with the right requests.
          </Text>
        </View>

        {/* ── Question 1 ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            What kind of content would you like to create?
          </Text>
          <View style={{ gap: Spacing.sm }}>
            {CONTENT_TYPE_OPTIONS.map(({ key, label, icon: Icon }) => (
              <CheckboxRow
                key={key}
                label={label}
                checked={contentTypes.includes(key)}
                onPress={() => setContentTypes((prev) => toggle(prev, key))}
                icon={
                  <Icon
                    size={20}
                    color={contentTypes.includes(key) ? Colors.secondary : Colors.textMuted}
                    strokeWidth={2}
                  />
                }
              />
            ))}
          </View>
        </View>

        {/* ── Question 2 ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Which topics are you interested in?</Text>
          <View style={{ gap: Spacing.sm }}>
            {TOPIC_OPTIONS.map(({ key, label }) => (
              <CheckboxRow
                key={key}
                label={label}
                checked={topics.includes(key)}
                onPress={() => setTopics((prev) => toggle(prev, key))}
              />
            ))}
          </View>

          {topics.includes('other') && (
            <TextInput
              value={otherTopic}
              onChangeText={setOtherTopic}
              placeholder="Tell us what else you'd like to share…"
              placeholderTextColor={Colors.textMuted}
              style={styles.otherInput}
              accessibilityLabel="Other topic"
            />
          )}
        </View>

        {!!formError && <Text style={styles.formErrorText}>{formError}</Text>}

        <Pressable
          onPress={handleContinue}
          disabled={!canContinue || submitting}
          accessibilityRole="button"
          accessibilityLabel="Continue"
          style={({ pressed }) => [
            styles.continueBtn,
            !canContinue && styles.continueBtnDisabled,
            pressed && canContinue && styles.continueBtnPressed,
          ]}
        >
          <Text style={[styles.continueText, !canContinue && styles.continueTextDisabled]}>
            {submitting ? 'Sending code…' : 'Continue'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.dominant },

  topBar: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },

  content: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: Spacing.xxl },

  heading: { gap: 4 },
  headline: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    color: Colors.text,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  subheadline: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },

  section: { gap: Spacing.sm },
  sectionTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: Colors.text,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 48,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 207, 0.4)',
    backgroundColor: Colors.white,
  },
  rowChecked: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondarySubtle,
  },
  rowPressed: { opacity: 0.85 },
  rowLabel: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.text,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  rowLabelChecked: {
    fontFamily: Typography.fontBodyMed,
    color: Colors.secondary,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(195, 198, 207, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },

  otherInput: {
    marginTop: Spacing.sm,
    minHeight: 48,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 207, 0.6)',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.text,
  },

  formErrorText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: '#ba1a1a',
    textAlign: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  continueBtn: {
    minHeight: 56,
    borderRadius: Radii.lg,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  continueBtnDisabled: { backgroundColor: Colors.surface },
  continueBtnPressed: { opacity: 0.9 },
  continueText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: Colors.accent,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  continueTextDisabled: { color: Colors.textMuted },
});

export default ContentPreferencesScreen;
