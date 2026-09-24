import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CircleAlert, Users } from 'lucide-react-native';
import { Header } from '../../components/common';
import {
  ApplicantCard,
  HireActionButton,
  RejectReasonSheet,
  VoiceReplySheet,
  ContentCaptureColors as D,
} from '../../components/module-specific/content-capture';
import type { VoiceReplyClip } from '../../components/module-specific/content-capture';
import { useJobApplicants } from '../../hooks/useJobApplicants';
import { useHireStrings } from '../../hooks/useHireStrings';
import type { JobApplicationSummary } from '../../types/hireRequest';
import { Typography, Spacing, Radii } from '../../theme';

/** How long the "Not selected" fade is left on screen before returning to My Requests. */
const TRANSITION_DELAY_MS = 1200;

interface ApplicantReviewScreenProps {
  jobRequestId: string;
  /** The request's own title — shown under the heading and on every applicant card. */
  jobTitle: string;
  onBack?: () => void;
  /** Fired shortly after a creator is chosen, once the other cards have visibly updated. */
  onCreatorChosen?: () => void;
}

/**
 * Screen 10 — Applicant Review ("Replies for Your Request"). Every applicant
 * gets a card (no cap). The elder can reply to one by voice before deciding,
 * approve one creator — the rest fade to "Not selected" and the screen
 * returns to My Requests — or reject individuals, with an optional note that
 * is never required.
 *
 * Voice replies are recorded and kept on the device only. Delivering one
 * needs a conversation id (POST /api/conversations/{id}/reply-voice), and a
 * still-pending application has no conversation yet — nothing creates one
 * until messaging exists (MessagingChannelPortImpl is a logging stub). So the
 * card says the reply is "saved on this device", never "sent".
 */
export const ApplicantReviewScreen: React.FC<ApplicantReviewScreenProps> = ({
  jobRequestId,
  jobTitle,
  onBack,
  onCreatorChosen,
}) => {
  const { t } = useHireStrings();
  const {
    applicants,
    loading,
    loadError,
    busyId,
    actionError,
    pendingCount,
    choose,
    decline,
    clearActionError,
    reload,
  } = useJobApplicants(jobRequestId);
  const [decliningApplicant, setDecliningApplicant] = useState<JobApplicationSummary | null>(null);
  const [voiceApplicant, setVoiceApplicant] = useState<JobApplicationSummary | null>(null);
  const [voiceReplies, setVoiceReplies] = useState<Record<string, VoiceReplyClip>>({});
  const [transitioning, setTransitioning] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    },
    [],
  );

  const hasChosen = applicants.some((application) => application.status === 'ACCEPTED');
  const locked = busyId !== null || transitioning;

  const handleChoose = async (applicant: JobApplicationSummary) => {
    if (await choose(applicant.id)) {
      setTransitioning(true);
      AccessibilityInfo.announceForAccessibility(
        `${applicant.creatorName}. ${t('applicants.selected')}`,
      );
      transitionTimer.current = setTimeout(() => onCreatorChosen?.(), TRANSITION_DELAY_MS);
    }
  };

  const handleDecline = async (reason?: string) => {
    if (!decliningApplicant) return;
    if (await decline(decliningApplicant.id, reason)) {
      setDecliningApplicant(null);
    }
  };

  const handleSaveVoiceReply = (clip: VoiceReplyClip) => {
    if (voiceApplicant) {
      setVoiceReplies((prev) => ({ ...prev, [voiceApplicant.id]: clip }));
    }
    setVoiceApplicant(null);
  };

  // Shown in the body (not under the heading, which always names the request).
  const bodyNote = (() => {
    if (loading || loadError || hasChosen) return null;
    if (applicants.length === 0) return t('applicants.empty');
    if (pendingCount === 0) return t('applicants.allResponded');
    return null;
  })();

  return (
    <View style={s.screen}>
      <StatusBar style="light" />

      <Header
        title={t('applicants.headerTitle')}
        showBack
        onBackPress={onBack}
        backLabel={t('common.back')}
        notificationLabel={t('common.notifications')}
      />

      <ScrollView
        style={s.flex}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.heading}>
          <Text style={s.title} accessibilityRole="header">
            {t('applicants.heading')}
          </Text>
          <Text style={s.subtitle} numberOfLines={3}>
            {t('applicants.forJob', { title: jobTitle })}
          </Text>
        </View>

        {loading && (
          <View style={s.centered}>
            <ActivityIndicator size="large" color={D.primary} accessibilityLabel={t('common.loading')} />
          </View>
        )}

        {loadError && (
          <View style={s.centered}>
            <View style={s.iconWrap}>
              <CircleAlert size={32} color={D.onSecondaryContainer} strokeWidth={2} />
            </View>
            <Text style={s.stateBody}>{t('applicants.loadError')}</Text>
            <HireActionButton label={t('common.retry')} onPress={reload} style={s.stateBtn} />
          </View>
        )}

        {!loading && !loadError && applicants.length === 0 && (
          <View style={s.centered} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Users size={48} color={D.outlineVariant} strokeWidth={1.5} />
          </View>
        )}

        {!!bodyNote && (
          <Text style={s.stateBody} accessibilityLiveRegion="polite">
            {bodyNote}
          </Text>
        )}

        {!!actionError && decliningApplicant === null && (
          <Text style={s.actionError} accessibilityRole="alert" accessibilityLiveRegion="assertive">
            {t('applicants.actionError')}
          </Text>
        )}

        <View style={s.list}>
          {applicants.map((applicant) => (
            <ApplicantCard
              key={applicant.id}
              applicant={applicant}
              jobTitle={jobTitle}
              busy={busyId === applicant.id && decliningApplicant === null}
              locked={locked}
              voiceReplySaved={!!voiceReplies[applicant.id]}
              onReplyWithVoice={setVoiceApplicant}
              onApprove={handleChoose}
              onReject={setDecliningApplicant}
            />
          ))}
        </View>
      </ScrollView>

      <VoiceReplySheet
        visible={voiceApplicant !== null}
        applicantName={voiceApplicant?.creatorName ?? ''}
        onClose={() => setVoiceApplicant(null)}
        onSave={handleSaveVoiceReply}
      />

      <RejectReasonSheet
        visible={decliningApplicant !== null}
        submitting={busyId !== null && decliningApplicant !== null}
        errorText={actionError && decliningApplicant ? t('applicants.actionError') : undefined}
        onClose={() => {
          setDecliningApplicant(null);
          clearActionError();
        }}
        onSkip={() => handleDecline(undefined)}
        onSend={handleDecline}
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
    gap: Spacing.md,
  },

  heading: { gap: Spacing.sm },
  title: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    lineHeight: 34,
    color: D.onSurface,
  },
  subtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: D.onSurfaceVariant,
  },

  list: { gap: Spacing.md },

  centered: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radii.full,
    backgroundColor: D.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateBody: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: D.onSurfaceVariant,
    textAlign: 'center',
  },
  stateBtn: { alignSelf: 'stretch', marginTop: Spacing.sm },

  actionError: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    lineHeight: 22,
    color: '#ba1a1a',
    textAlign: 'center',
  },
});

export default ApplicantReviewScreen;
