import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { PersonPhoto } from '../marketplace/PersonPhoto';
import { resolveImageUrl } from '../../../constants/api';
import { useLocaleStore } from '../../../store/localeStore';
import { formatTimeAgo } from '../../../utils/timeAgo';
import type { OpportunityApplicationResponse } from '../../../types/opportunityApplication';
import { Typography, Spacing, Radii } from '../../../theme';
import { ContentCaptureColors as D } from './tokens';

interface CreatorApplicationCardProps {
  application: OpportunityApplicationResponse;
  /** Opens the full application, where the elder approves or rejects it and can message the creator. */
  onPress?: (application: OpportunityApplicationResponse) => void;
}

/**
 * One creator who applied to the elder's opportunity - a summary row (photo, name, what they applied for,
 * the offered amount and how long ago). The decision itself is made on the application's own screen.
 */
export const CreatorApplicationCard: React.FC<CreatorApplicationCardProps> = ({ application, onPress }) => {
  const { t } = useTranslation('contentCapture');
  const locale = useLocaleStore((state) => state.locale);
  const name = application.creatorName?.trim() || t('creatorApps.creatorFallback');
  const accepted = application.status === 'APPROVED' || application.status === 'BOOKED';
  const declined = application.status === 'REJECTED';

  const statusLabel =
    application.status === 'APPROVED'
      ? t('creatorApps.statusAccepted')
      : application.status === 'BOOKED'
        ? t('creatorApps.statusBooked')
        : application.status === 'REJECTED'
          ? t('creatorApps.statusDeclined')
          : t('creatorApps.statusPending');
  const ago = formatTimeAgo(application.submittedAt, locale);
  const amount = application.offeredAmount != null ? Math.round(application.offeredAmount).toLocaleString('en-US') : null;

  return (
    <Pressable
      onPress={() => onPress?.(application)}
      accessibilityRole="button"
      accessibilityLabel={`${name}. ${application.title}. ${statusLabel}`}
      accessibilityHint={t('creatorApps.viewHint')}
      style={({ pressed }) => [s.card, accepted && s.cardAccepted, declined && s.cardDeclined, pressed && s.pressed]}
    >
      <PersonPhoto name={name} size={52} source={application.creatorPhotoUrl ? { uri: resolveImageUrl(application.creatorPhotoUrl) ?? '' } : null} />
      <View style={s.body}>
        <Text style={s.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={s.appliedTo} numberOfLines={2}>
          {t('creatorApps.appliedTo', { title: application.title })}
        </Text>
        <View style={s.metaRow}>
          <View style={[s.chip, accepted ? s.chipAccepted : declined ? s.chipDeclined : s.chipPending]}>
            {accepted && <Check size={12} color={D.onPrimary} strokeWidth={3} />}
            <Text style={[s.chipText, accepted && { color: D.onPrimary }]}>{statusLabel}</Text>
          </View>
          {amount && <Text style={s.meta}>{t('creatorApps.amount', { amount })}</Text>}
          {!!ago && <Text style={s.meta}>{t('creatorApps.appliedAgo', { time: ago })}</Text>}
        </View>
      </View>
      <ChevronRight size={22} color={D.onSurfaceVariant} strokeWidth={2} />
    </Pressable>
  );
};

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    padding: Spacing.md,
    minHeight: 80,
  },
  cardAccepted: { borderColor: D.primary, borderWidth: 2 },
  cardDeclined: { backgroundColor: D.surfaceContainerLow, opacity: 0.85 },
  pressed: { opacity: 0.88 },
  body: { flex: 1, gap: 4 },
  name: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG, lineHeight: 26, color: D.onSurface },
  appliedTo: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 21, color: D.onSurfaceVariant },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.sm },
  meta: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, lineHeight: 16, color: D.onSurfaceVariant },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radii.full, paddingVertical: 3, paddingHorizontal: 10 },
  chipPending: { backgroundColor: D.secondaryContainer },
  chipAccepted: { backgroundColor: D.primary },
  chipDeclined: { backgroundColor: D.surfaceVariant },
  chipText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, lineHeight: 16, color: D.onSurface },
});

export default CreatorApplicationCard;
