import React, { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ShieldCheck } from 'lucide-react-native';
import { Header, UserFooter } from '../../components/common';
import type { UserTabKey } from '../../components/common';
import {
  ElderNavDrawer,
  HireActionButton,
  MicInputField,
  ContentCaptureColors as D,
} from '../../components/module-specific/content-capture';
import type { ElderDrawerItem } from '../../components/module-specific/content-capture';
import { usePostHireRequest } from '../../hooks/usePostHireRequest';
import { useHireStrings } from '../../hooks/useHireStrings';
import { useKeyboardVisible } from '../../hooks/useKeyboardVisible';
import { Typography, Spacing } from '../../theme';

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
  /** Fired once the request has been posted — the navigator moves on to My Requests. */
  onSubmitted?: () => void;
  onTabPress?: (tab: UserTabKey) => void;
  onDrawerNavigate?: (item: ElderDrawerItem) => void;
  onLogout?: () => void;
}

/**
 * Screen 8 — Request Creator Assistance. A short intro and guidance list
 * (what's worth mentioning), then just two fields — a title and free-text
 * details, each with a mic for dictation. Where and how the elder wants it
 * recorded is something they say in the details, not a separate input. The
 * single primary action sits at the bottom with a reassurance line beneath.
 */
export const PostHireRequestScreen: React.FC<PostHireRequestScreenProps> = ({
  onSubmitted,
  onTabPress,
  onDrawerNavigate,
  onLogout,
}) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const keyboardVisible = useKeyboardVisible();
  const { t, speechLang, voiceLabels } = useHireStrings();
  const { title, setTitle, description, setDescription, submitting, errorKey, submit } = usePostHireRequest();

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

          <MicInputField
            label={t('post.descriptionLabel')}
            value={description}
            onChangeText={setDescription}
            placeholder={t('post.descriptionPlaceholder')}
            multiline
            minInputHeight={160}
            errorText={descriptionError}
            voiceLang={speechLang}
            voiceLabels={voiceLabels(t('post.field.description'))}
          />

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
