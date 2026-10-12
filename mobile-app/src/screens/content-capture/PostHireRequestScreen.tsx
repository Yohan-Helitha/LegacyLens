import React, { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Mic, ShieldCheck } from 'lucide-react-native';
import { Header, RoundIconButton, UserFooter } from '../../components/common';
import type { UserTabKey } from '../../components/common';
import {
  ElderNavDrawer,
  HireActionButton,
  MediaPreviewCard,
  MicInputField,
  ContentCaptureColors as D,
} from '../../components/module-specific/content-capture';
import type { ElderDrawerItem } from '../../components/module-specific/content-capture';
import { usePostHireRequest } from '../../hooks/usePostHireRequest';
import type { HireRequestVoiceNote } from '../../hooks/usePostHireRequest';
import { useHireStrings } from '../../hooks/useHireStrings';
import { useKeyboardVisible } from '../../hooks/useKeyboardVisible';
import { Typography, Spacing, Radii } from '../../theme';

/** Guidance for what to write into the two fields below — not form inputs themselves. */
const GUIDANCE_KEYS = [
  'post.guidance.1',
  'post.guidance.2',
  'post.guidance.3',
  'post.guidance.4',
  'post.guidance.5',
  'post.guidance.6',
] as const;

interface PostHireRequestScreenProps {
  /** The recorded Details clip, if any — owned by the navigator so it survives the trip to AudioRecordingScreen and back. */
  voiceNote: HireRequestVoiceNote | null;
  /** Opens AudioRecordingScreen to record (or re-record) the Details clip. */
  onRecordVoiceNote: () => void;
  /** Fired once the request has been posted — the navigator moves on to My Requests. */
  onSubmitted?: () => void;
  onTabPress?: (tab: UserTabKey) => void;
  onDrawerNavigate?: (item: ElderDrawerItem) => void;
  onLogout?: () => void;
}

/**
 * Screen 8 — Request Creator Assistance. A short intro and guidance list
 * (what's worth mentioning), a dictated title, and a recorded voice note for
 * the details — not transcribed, so the admin reviewing a request hears it
 * directly rather than through speech-to-text. The single primary action
 * sits at the bottom with a reassurance line beneath.
 */
export const PostHireRequestScreen: React.FC<PostHireRequestScreenProps> = ({
  voiceNote,
  onRecordVoiceNote,
  onSubmitted,
  onTabPress,
  onDrawerNavigate,
  onLogout,
}) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const keyboardVisible = useKeyboardVisible();
  const { t, speechLang, voiceLabels } = useHireStrings();
  const { title, setTitle, submitting, errorKey, submit } = usePostHireRequest(voiceNote);

  const handleSubmit = async () => {
    if (await submit()) onSubmitted?.();
  };

  const titleError = errorKey === 'post.error.titleRequired' ? t(errorKey) : undefined;
  const descriptionError = errorKey === 'post.error.descriptionRequired' ? t(errorKey) : undefined;
  const submitError = errorKey === 'post.error.submitFailed' ? t(errorKey) : undefined;

  return (
    <View style={s.screen}>
      <StatusBar style="light" />

      <Header
        title={t('post.headerTitle')}
        onMenuPress={() => setDrawerVisible(true)}
        menuLabel={t('common.openMenu')}
        notificationLabel={t('common.notifications')}
      />

      <KeyboardAvoidingView style={s.flex} behavior="padding">
        <ScrollView
          style={s.flex}
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.heading}>
            <Text style={s.title} accessibilityRole="header">
              {t('post.heading')}
            </Text>
            <Text style={s.subtitle}>{t('post.intro')}</Text>

            <View style={s.guidance} accessibilityRole="list">
              {GUIDANCE_KEYS.map((key) => (
                <View key={key} style={s.bulletRow} accessible accessibilityRole="text">
                  <Text style={s.bullet} importantForAccessibility="no" accessibilityElementsHidden>
                    •
                  </Text>
                  <Text style={s.bulletText}>{t(key)}</Text>
                </View>
              ))}
            </View>
          </View>

          <MicInputField
            label={t('post.titleLabel')}
            value={title}
            onChangeText={setTitle}
            placeholder={t('post.titlePlaceholder')}
            maxLength={200}
            errorText={titleError}
            voiceLang={speechLang}
            voiceLabels={voiceLabels(t('post.field.title'))}
          />

          <View style={s.section}>
            <Text style={s.sectionLabel}>{t('post.descriptionLabel')}</Text>

            {voiceNote ? (
              <>
                <MediaPreviewCard
                  mediaType="AUDIO"
                  uri={voiceNote.uri}
                  durationMillis={voiceNote.durationMillis}
                  onRerecord={onRecordVoiceNote}
                />
                <Text style={s.recordHint}>{t('post.recordDetailsAgain')}</Text>
              </>
            ) : (
              <Pressable
                onPress={onRecordVoiceNote}
                style={({ pressed }) => [
                  s.recordCard,
                  !!descriptionError && s.recordCardError,
                  pressed && s.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('post.recordDetailsPrompt')}
              >
                <RoundIconButton
                  icon={Mic}
                  size={48}
                  color={D.onSecondaryContainer}
                  backgroundColor={D.secondaryContainer}
                  onPress={onRecordVoiceNote}
                  accessibilityLabel={t('post.recordDetailsPrompt')}
                />
                <Text style={s.recordCardText}>{t('post.recordDetailsPrompt')}</Text>
              </Pressable>
            )}

            {!!descriptionError && <Text style={s.fieldErrorText}>{descriptionError}</Text>}
          </View>

          <View style={s.submitBlock}>
            {!!submitError && (
              <Text style={s.submitError} accessibilityRole="alert" accessibilityLiveRegion="assertive">
                {submitError}
              </Text>
            )}

            <HireActionButton
              label={submitting ? t('post.submitting') : t('post.submit')}
              size="large"
              onPress={handleSubmit}
              loading={submitting}
            />

            <View style={s.reassurance}>
              <ShieldCheck size={16} color={D.onSurfaceVariant} strokeWidth={2} />
              <Text style={s.reassuranceText}>{t('post.reassurance')}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {!keyboardVisible && <UserFooter activeTab="home" onTabSelect={(tab) => onTabPress?.(tab)} />}

      <ElderNavDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        activeItem="hire"
        onNavigate={onDrawerNavigate}
        onLogout={onLogout}
      />
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: D.surface },
  flex: { flex: 1 },

  content: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },

  heading: { gap: Spacing.sm },
  title: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size2XL,
    lineHeight: 42,
    color: D.onSurface,
  },
  subtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    lineHeight: 26,
    color: D.onSurfaceVariant,
  },
  guidance: { gap: 6, marginTop: Spacing.xs },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingStart: Spacing.xs },
  bullet: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    lineHeight: 21,
    color: D.onSurfaceVariant,
  },
  bulletText: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    lineHeight: 21,
    color: D.onSurfaceVariant,
  },

  section: { gap: Spacing.sm },
  sectionLabel: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
    letterSpacing: 0.3,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(15,92,92,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,92,92,0.18)',
    borderRadius: Radii.xl,
    padding: Spacing.md,
    minHeight: 72,
  },
  recordCardError: { borderColor: '#ba1a1a', borderWidth: 1.5 },
  recordCardText: {
    flex: 1,
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeMD,
    color: D.onSurface,
  },
  recordHint: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: D.onSurfaceVariant,
  },
  fieldErrorText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: '#ba1a1a',
  },
  pressed: { opacity: 0.85 },

  submitBlock: { gap: Spacing.md, marginTop: Spacing.sm },
  submitError: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    lineHeight: 22,
    color: '#ba1a1a',
    textAlign: 'center',
  },
  reassurance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
  },
  reassuranceText: {
    flexShrink: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    lineHeight: 22,
    color: D.onSurfaceVariant,
    textAlign: 'center',
  },
});

export default PostHireRequestScreen;
