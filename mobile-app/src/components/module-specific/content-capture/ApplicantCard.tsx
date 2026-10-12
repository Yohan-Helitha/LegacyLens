import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Check, Mic } from 'lucide-react-native';
import { Avatar } from '../../common';
import { useHireStrings } from '../../../hooks/useHireStrings';
import type { JobApplicationSummary } from '../../../types/hireRequest';
import { Typography, Spacing, Radii } from '../../../theme';
import { HireActionButton } from './HireActionButton';
import { RatingStars } from './RatingStars';
import { ContentCaptureColors as D } from './tokens';

interface ApplicantCardProps {
  applicant: JobApplicationSummary;
  /** The request this creator applied to — shown on every card so it's clear what they're replying to. */
  jobTitle: string;
  /** This card's own approve/reject request is in flight. */
  busy?: boolean;
  /** Any card's request is in flight — every action button is locked so two can't race. */
  locked?: boolean;
  /** The elder has already recorded a voice reply for this applicant. */
  voiceReplySaved?: boolean;
  onReplyWithVoice?: (applicant: JobApplicationSummary) => void;
  onApprove?: (applicant: JobApplicationSummary) => void;
  onReject?: (applicant: JobApplicationSummary) => void;
}

/** Dim enough to read as "set aside", high enough that the "Not selected" text stays legible. */
const MUTED_OPACITY = 0.72;

/**
 * One applicant on Applicant Review (Screen 10). PENDING cards stack three
 * full-width actions in descending weight: "Reply with voice" (deep teal,
 * the most prominent — ask a question before committing), "Approve"
 * (mango-orange) and "Reject" (quiet outline, lowest weight). Once decided,
 * the buttons are replaced by a status chip: "Chosen" for the approved
 * creator, a muted "Not selected" for everyone else (including creators the
 * backend auto-declined).
 */
export const ApplicantCard: React.FC<ApplicantCardProps> = ({
  applicant,
  jobTitle,
  busy = false,
  locked = false,
  voiceReplySaved = false,
  onReplyWithVoice,
  onApprove,
  onReject,
}) => {
  const { t, formatRating } = useHireStrings();
  const isPending = applicant.status === 'PENDING';
  const isChosen = applicant.status === 'ACCEPTED';
  const isMuted = applicant.status === 'REJECTED';

  // Fade to the muted state rather than snapping, so the change reads as a result of the tap.
  const opacity = useRef(new Animated.Value(isMuted ? MUTED_OPACITY : 1)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: isMuted ? MUTED_OPACITY : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isMuted, opacity]);

  const rating = applicant.creatorRating;
  const message = applicant.message?.trim();

  return (
    <Animated.View style={[s.card, isChosen && s.cardChosen, isMuted && s.cardMuted, { opacity }]}>
      <View style={s.header}>
        <Avatar size={52} />
        <View style={s.identity}>
          <Text style={s.name} numberOfLines={2}>
            {applicant.creatorName}
          </Text>
          <RatingStars
            rating={rating}
            ratingText={rating == null ? '' : formatRating(rating)}
            emptyText={t('applicants.noRating')}
            accessibilityLabel={rating == null ? t('applicants.noRating') : t('applicants.rating', { rating: formatRating(rating) })}
          />
        </View>
      </View>

      <Text style={s.appliedTo} numberOfLines={2}>
        {t('applicants.appliedTo', { title: jobTitle })}
      </Text>

      <View
        accessible
        accessibilityLabel={
          message
            ? `${t('applicants.messageFrom', { name: applicant.creatorName })}. ${message}`
            : t('applicants.noMessage')
        }
        style={s.messageBlock}
      >
        <Text style={s.messageLabel}>{t('applicants.messageLabel')}</Text>
        <View style={s.quote}>
          <Text style={[s.quoteText, !message && s.quoteTextEmpty]}>
            {message ? `“${message}”` : t('applicants.noMessage')}
          </Text>
        </View>
      </View>

      {isPending && (
        <View style={s.actions}>
          <HireActionButton
            label={t('applicants.replyVoice')}
            accessibilityLabel={t('applicants.replyVoiceAccessibility', { name: applicant.creatorName })}
            icon={Mic}
            size="large"
            onPress={() => onReplyWithVoice?.(applicant)}
            disabled={locked}
          />
          {voiceReplySaved && (
            <View style={s.savedNote} accessibilityLiveRegion="polite">
              <Check size={14} color={D.primary} strokeWidth={3} />
              <Text style={s.savedNoteText}>{t('applicants.voiceReplySaved')}</Text>
            </View>
          )}
          <HireActionButton
            label={busy ? t('applicants.approving') : t('applicants.approve')}
            accessibilityLabel={t('applicants.approveAccessibility', { name: applicant.creatorName })}
            variant="accent"
            onPress={() => onApprove?.(applicant)}
            loading={busy}
            disabled={locked && !busy}
          />
          <HireActionButton
            label={t('applicants.reject')}
            accessibilityLabel={t('applicants.rejectAccessibility', { name: applicant.creatorName })}
            variant="secondary"
            onPress={() => onReject?.(applicant)}
            disabled={locked}
          />
        </View>
      )}

      {isChosen && (
        <View style={[s.chip, s.chipChosen]} accessibilityLiveRegion="polite">
          <Check size={14} color={D.onPrimary} strokeWidth={3} />
          <Text style={[s.chipText, { color: D.onPrimary }]}>{t('applicants.selected')}</Text>
        </View>
      )}

      {isMuted && (
        <View style={[s.chip, s.chipMuted]} accessibilityLiveRegion="polite">
          <Text style={[s.chipText, { color: D.onSurfaceVariant }]}>{t('applicants.notSelected')}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardChosen: { borderColor: D.primary, borderWidth: 2 },
  cardMuted: { backgroundColor: D.surfaceContainerLow, elevation: 0, shadowOpacity: 0 },

  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  identity: { flex: 1, gap: 6 },
  name: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeLG,
    lineHeight: 26,
    color: D.onSurface,
  },
  appliedTo: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    lineHeight: 21,
    color: D.onSurfaceVariant,
  },

  messageBlock: { gap: 6 },
  messageLabel: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
    letterSpacing: 0.3,
  },
  // Lightly bordered quote block — teal rule on the leading edge, soft tint inside.
  quote: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    borderStartWidth: 3,
    borderStartColor: D.primaryContainer,
    borderRadius: Radii.md,
    backgroundColor: D.surfaceContainerLow,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
  },
  quoteText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: D.onSurface,
  },
  quoteTextEmpty: { color: D.onSurfaceVariant },

  // Full-width stack, heaviest first.
  actions: { gap: Spacing.sm },
  savedNote: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.xs },
  savedNoteText: {
    flexShrink: 1,
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    lineHeight: 20,
    color: D.primary,
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    minHeight: 32,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.full,
  },
  chipChosen: { backgroundColor: D.primary },
  chipMuted: { backgroundColor: D.surfaceVariant },
  chipText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM },
});

export default ApplicantCard;
