import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CircleAlert, MessageCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog, Header } from '../../components/common';
import { HireActionButton } from '../../components/module-specific/content-capture';
import { PersonPhoto } from '../../components/module-specific/marketplace/PersonPhoto';
import { ContentCaptureColors as D } from '../../components/module-specific/content-capture/tokens';
import { useElderApplications } from '../../hooks/useElderApplications';
import { resolveImageUrl } from '../../constants/api';
import { useLocaleStore } from '../../store/localeStore';
import { formatDate } from '../../utils/timeAgo';
import { formatShortDate } from '../../utils/messageTime';
import { Typography, Spacing, Radii } from '../../theme';

interface ApplicationDetailScreenProps {
  applicationId: string;
  onBack?: () => void;
  /** Opens the chat with this creator (the conversation id comes from messagingApi.open). */
  onOpenChat?: (conversationId: string) => void;
}

/** A labelled block of text; renders nothing when there is nothing real to show. */
const Section: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
  <View style={s.section}>
    <Text style={s.sectionTitle} accessibilityRole="header">
      {title}
    </Text>
    {children}
  </View>
);

const Row: React.FC<{ label: string; value?: string | null }> = ({ label, value }) =>
  value ? (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  ) : null;

/**
 * One creator's application to the elder's opportunity: what they offer and the opportunity itself, with
 * Approve / Reject (each asks first) while it is undecided and "Message" to chat with them. Everything shown
 * comes from the backend; a section with nothing in it is left out.
 */
export const ApplicationDetailScreen: React.FC<ApplicationDetailScreenProps> = ({ applicationId, onBack, onOpenChat }) => {
  const { t } = useTranslation('contentCapture');
  const locale = useLocaleStore((state) => state.locale);
  const { applications, loading, loadError, busyId, actionError, approve, reject, openChat, clearActionError, reload } =
    useElderApplications();
  const [confirm, setConfirm] = useState<'approve' | 'reject' | null>(null);
  const [notice, setNotice] = useState('');

  const application = applications.find((item) => item.id === applicationId);
  const name = application?.creatorName?.trim() || t('creatorApps.creatorFallback');
  const busy = busyId !== null;
  const isPending = application?.status === 'PENDING';
  const canMessage = application?.status === 'PENDING' || application?.status === 'APPROVED' || application?.status === 'BOOKED';

  const decide = async () => {
    const decision = confirm;
    setConfirm(null);
    if (!application || !decision) return;
    const ok = decision === 'approve' ? await approve(application.id) : await reject(application.id);
    if (ok) setNotice(t(decision === 'approve' ? 'applicationDetail.approvedNote' : 'applicationDetail.rejectedNote'));
  };

  const message = async () => {
    if (!application) return;
    const conversationId = await openChat(application);
    if (conversationId) onOpenChat?.(conversationId);
  };

  const languages = (application?.languages ?? []).map((item) => item.language).filter(Boolean).join(', ');
  const date = application?.scheduledDate ? formatShortDate(application.scheduledDate) : '';
  const decidedOn = application?.decidedAt ? formatDate(application.decidedAt, locale) : '';

  return (
    <View style={s.screen}>
      <StatusBar style="light" />
      <Header title={t('applicationDetail.headerTitle')} showBack onBackPress={onBack} />

      {loading && !application && (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={D.primary} />
        </View>
      )}

      {!loading && !application && (
        <View style={s.centered}>
          <CircleAlert size={32} color={D.onSecondaryContainer} strokeWidth={2} />
          <Text style={s.body}>{t(loadError ? 'applicationDetail.loadError' : 'applicationDetail.notFound')}</Text>
          {loadError && <HireActionButton label={t('applicationDetail.retry')} variant="neutral" onPress={reload} />}
        </View>
      )}

      {!!application && (
        <>
          <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
            <View style={s.identity}>
              <PersonPhoto
                name={name}
                size={72}
                source={application.creatorPhotoUrl ? { uri: resolveImageUrl(application.creatorPhotoUrl) ?? '' } : null}
              />
              <View style={s.identityText}>
                <Text style={s.name}>{name}</Text>
                <Text style={s.body}>{t('creatorApps.appliedTo', { title: application.title })}</Text>
                <Text style={s.status}>
                  {application.status === 'PENDING'
                    ? t('creatorApps.statusPending')
                    : application.status === 'REJECTED'
                      ? t('creatorApps.statusDeclined')
                      : application.status === 'BOOKED'
                        ? t('creatorApps.statusBooked')
                        : t('creatorApps.statusAccepted')}
                  {decidedOn ? ` · ${t('applicationDetail.decidedOn', { date: decidedOn })}` : ''}
                </Text>
              </View>
            </View>

            {!!notice && (
              <Text style={s.notice} accessibilityRole="alert" accessibilityLiveRegion="polite">
                {notice}
              </Text>
            )}
            {actionError !== null && (
              <Text style={s.error} accessibilityRole="alert" accessibilityLiveRegion="polite" onPress={clearActionError}>
                {actionError || t('creatorApps.actionError')}
              </Text>
            )}

            <Section title={t('applicationDetail.offers', { name })}>
              {application.skills?.length > 0 && <Row label={t('applicationDetail.skills')} value={application.skills.join(', ')} />}
              <Row label={t('applicationDetail.experience')} value={application.experienceText} />
              <Row label={t('applicationDetail.approach')} value={application.approachText} />
              {application.equipment?.length > 0 && <Row label={t('applicationDetail.equipment')} value={application.equipment.join(', ')} />}
              <Row label={t('applicationDetail.languages')} value={languages} />
            </Section>

            <Section title={t('applicationDetail.opportunity')}>
              <Row label={t('applicationDetail.date')} value={date} />
              <Row label={t('applicationDetail.time')} value={application.timeWindowText} />
              <Row
                label={t('applicationDetail.amount')}
                value={application.offeredAmount != null ? t('creatorApps.amount', { amount: Math.round(application.offeredAmount).toLocaleString('en-US') }) : null}
              />
              <Row label={t('applicationDetail.spoken')} value={application.language} />
            </Section>
          </ScrollView>

          <View style={s.footer}>
            {isPending && (
              <>
                <HireActionButton
                  label={busy ? t('applicationDetail.approving') : t('applicationDetail.approve')}
                  variant="accent"
                  size="large"
                  loading={busy}
                  onPress={() => setConfirm('approve')}
                />
                <HireActionButton
                  label={t('applicationDetail.reject')}
                  variant="secondary"
                  disabled={busy}
                  onPress={() => setConfirm('reject')}
                />
              </>
            )}
            {canMessage && (
              <HireActionButton
                label={t('applicationDetail.message', { name })}
                icon={MessageCircle}
                variant={isPending ? 'neutral' : 'primary'}
                size={isPending ? 'medium' : 'large'}
                disabled={busy}
                onPress={message}
              />
            )}
          </View>
        </>
      )}

      <ConfirmDialog
        visible={confirm !== null}
        title={t(confirm === 'reject' ? 'applicationDetail.rejectTitle' : 'applicationDetail.approveTitle', { name })}
        message={t(confirm === 'reject' ? 'applicationDetail.rejectBody' : 'applicationDetail.approveBody', { name })}
        confirmLabel={t(confirm === 'reject' ? 'applicationDetail.reject' : 'applicationDetail.approve')}
        cancelLabel={t('workDetail.cancel')}
        onConfirm={decide}
        onCancel={() => setConfirm(null)}
      />
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: D.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.lg },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xl },

  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  identityText: { flex: 1, gap: 4 },
  name: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeXL, lineHeight: 32, color: D.onSurface },
  body: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, lineHeight: 24, color: D.onSurfaceVariant },
  status: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, lineHeight: 21, color: D.primary },

  notice: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: D.onPrimary,
    backgroundColor: D.primary,
    borderRadius: Radii.lg,
    padding: Spacing.md,
  },
  error: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, lineHeight: 22, color: '#ba1a1a' },

  section: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeLG, lineHeight: 26, color: D.onSurface },
  row: { gap: 2 },
  rowLabel: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },
  rowValue: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, lineHeight: 24, color: D.onSurface },

  footer: {
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: D.surfaceContainerLowest,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: D.outlineVariant,
  },
});

export default ApplicationDetailScreen;
