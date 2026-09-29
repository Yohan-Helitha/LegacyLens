import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Award, Check, Languages, UserRound, Video } from 'lucide-react-native';
import { Avatar } from '../../common';
import { useHireStrings } from '../../../hooks/useHireStrings';
import type { RecommendedCreator } from '../../../types/creatorRecommendation';
import { Typography, Spacing, Radii } from '../../../theme';
import { HireActionButton } from './HireActionButton';
import { RatingStars } from './RatingStars';
import { ContentCaptureColors as D } from './tokens';

interface RecommendedCreatorCardProps {
  creator: RecommendedCreator;
  /**
   * best — the single top match: larger, highlighted, with the creator's own
   *   words and every "why we recommend" reason.
   * compact — the other matches: identity, rating and the two actions only.
   */
  variant?: 'best' | 'compact';
  /** This card's choose request is in flight. */
  busy?: boolean;
  /** Any card's choose request is in flight — lock every action so two can't race. */
  locked?: boolean;
  onChoose?: (creator: RecommendedCreator) => void;
  onViewProfile?: (creator: RecommendedCreator) => void;
}

/**
 * One recommended creator on the Content Creator Recommendation screen.
 *
 * Built for older eyes: nothing below 16dp except the rating figure, no
 * italics or thin weights, every fact paired with an icon *and* words, and
 * full-width 48–56dp buttons with the main action always first.
 */
export const RecommendedCreatorCard: React.FC<RecommendedCreatorCardProps> = ({
  creator,
  variant = 'compact',
  busy = false,
  locked = false,
  onChoose,
  onViewProfile,
}) => {
  const { t, formatRating } = useHireStrings();
  const isBest = variant === 'best';
  const rating = creator.rating;
  const about = creator.about?.trim();

  return (
    <View style={[s.card, isBest && s.cardBest]}>
      {isBest && (
        <View style={s.badge}>
          <Award size={18} color={D.onPrimary} strokeWidth={2.25} />
          <Text style={s.badgeText}>{t('recommend.bestMatch')}</Text>
        </View>
      )}

      <View style={s.header}>
        <Avatar uri={creator.avatarUrl} size={isBest ? 68 : 56} />
        <View style={s.identity}>
          <Text style={[s.name, isBest && s.nameBest]}>{creator.name}</Text>
          <RatingStars
            rating={rating}
            ratingText={rating == null ? '' : formatRating(rating)}
            emptyText={t('applicants.noRating')}
            accessibilityLabel={
              rating == null ? t('applicants.noRating') : t('applicants.rating', { rating: formatRating(rating) })
            }
            size={20}
          />
          <Text style={s.meta}>{t('recommend.completedJobs', { count: creator.completedJobs })}</Text>
        </View>
      </View>

      {(!!creator.specialty || creator.languages.length > 0) && (
        <View style={s.facts}>
          {!!creator.specialty && (
            <View style={s.factRow}>
              <Video size={20} color={D.primary} strokeWidth={2.25} />
              <Text style={s.factTextStrong}>{creator.specialty}</Text>
            </View>
          )}
          {creator.languages.length > 0 && (
            <View style={s.factRow}>
              <Languages size={20} color={D.primary} strokeWidth={2.25} />
              <Text style={s.factText}>{t('recommend.speaks', { languages: creator.languages.join(', ') })}</Text>
            </View>
          )}
        </View>
      )}

      {isBest && (!!about || creator.reasons.length > 0) && (
        <View style={s.whyBox}>
          {!!about && <Text style={s.about}>“{about}”</Text>}

          {creator.reasons.length > 0 && (
            <View style={s.reasons}>
              <Text style={s.whyTitle}>{t('recommend.whyTitle')}</Text>
              {creator.reasons.map((reason) => (
                <View key={reason} style={s.reasonRow}>
                  <View style={s.reasonTick}>
                    <Check size={14} color={D.onPrimary} strokeWidth={3} />
                  </View>
                  <Text style={s.reasonText}>{reason}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {isBest ? (
        <View style={s.actionsStack}>
          <HireActionButton
            label={busy ? t('recommend.choosing') : t('recommend.choose')}
            accessibilityLabel={t('recommend.chooseAccessibility', { name: creator.name })}
            size="large"
            loading={busy}
            disabled={locked && !busy}
            onPress={() => onChoose?.(creator)}
          />
          <HireActionButton
            label={t('recommend.viewProfile')}
            accessibilityLabel={t('recommend.viewProfileAccessibility', { name: creator.name })}
            variant="neutral"
            icon={UserRound}
            disabled={locked}
            onPress={() => onViewProfile?.(creator)}
          />
        </View>
      ) : (
        <View style={s.actionsRow}>
          <HireActionButton
            label={t('recommend.viewProfile')}
            accessibilityLabel={t('recommend.viewProfileAccessibility', { name: creator.name })}
            variant="neutral"
            disabled={locked}
            onPress={() => onViewProfile?.(creator)}
            style={s.rowButton}
          />
          <HireActionButton
            label={busy ? t('recommend.choosing') : t('recommend.chooseShort')}
            accessibilityLabel={t('recommend.chooseAccessibility', { name: creator.name })}
            loading={busy}
            disabled={locked && !busy}
            onPress={() => onChoose?.(creator)}
            style={s.rowButton}
          />
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardBest: { borderColor: D.primary, borderWidth: 2, paddingTop: Spacing.md + 2 },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: Radii.full,
    backgroundColor: D.primary,
  },
  badgeText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.onPrimary },

  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  identity: { flex: 1, gap: 4 },
  name: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeLG,
    lineHeight: 26,
    color: D.onSurface,
  },
  nameBest: { fontFamily: Typography.fontDisplay, fontSize: 22, lineHeight: 30 },
  meta: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeMD,
    lineHeight: 22,
    color: D.onSurfaceVariant,
  },

  facts: { gap: Spacing.sm },
  factRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  factTextStrong: {
    flex: 1,
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    lineHeight: 22,
    color: D.primary,
  },
  factText: {
    flex: 1,
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeMD,
    lineHeight: 22,
    color: D.onSurface,
  },

  whyBox: {
    backgroundColor: D.surfaceContainerLow,
    borderRadius: Radii.lg,
    borderStartWidth: 4,
    borderStartColor: D.primaryContainer,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  about: {
    fontFamily: Typography.fontBodyMed,
    fontSize: 17,
    lineHeight: 26,
    color: D.onSurface,
  },
  reasons: { gap: Spacing.sm },
  whyTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 17,
    lineHeight: 24,
    color: D.secondary,
  },
  reasonRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  reasonTick: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: D.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  reasonText: {
    flex: 1,
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: D.onSurface,
  },

  actionsStack: { gap: Spacing.sm },
  // Wraps to two rows on narrow screens / large text instead of squashing the labels.
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  rowButton: { flexGrow: 1, flexBasis: 140 },
});

export default RecommendedCreatorCard;
