import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar, TranslatedText } from '../../common';
import { getMediaUrl } from '../../../constants/api';
import type { Review } from '../../../types/review';
import { formatShortDate } from '../../../utils/dateFormat';
import { Typography, Spacing, Radii } from '../../../theme';
import { RatingStars } from './RatingStars';
import { ContentCaptureColors as D } from './tokens';
import { useTranslation } from 'react-i18next';

interface ReviewCardProps {
  review: Review;
}

/** Avatars come back either absolute or root-relative to the API host. */
function resolveAvatar(url: string | null): string | null {
  if (!url) return null;
  return /^https?:\/\//.test(url) ? url : getMediaUrl(url);
}

/**
 * One review on Reviews & Ratings (Screen 11). Text-forward and read-only —
 * no reply or react actions. A rating-only review (no comment) renders
 * without leaving a gap where the comment would be.
 */
export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const { t } = useTranslation('contentCapture');
  const comment = review.comment?.trim();
  const date = formatShortDate(review.createdAt);

  return (
    <View style={s.card}>
      <View style={s.header}>
        <Avatar size={44} uri={resolveAvatar(review.reviewerAvatarUrl)} />
        <View style={s.identity}>
          <Text style={s.name} numberOfLines={2}>
            {review.reviewerName}
          </Text>
          <RatingStars
            rating={review.score}
            ratingText=""
            emptyText=""
            accessibilityLabel={t('reviews.rated', { score: review.score })}
            size={16}
          />
        </View>
        {!!date && <Text style={s.date}>{date}</Text>}
      </View>

      {!!comment && <TranslatedText text={comment} style={s.comment} />}
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    padding: Spacing.md,
    gap: Spacing.sm + 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  identity: { flex: 1, gap: 4 },
  name: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    lineHeight: 22,
    color: D.onSurface,
  },
  date: {
    alignSelf: 'flex-start',
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: D.onSurfaceVariant,
  },
  comment: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: D.onSurface,
  },
});

export default ReviewCard;
