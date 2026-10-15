import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Check, MessageCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../../common';
import { resolveImageUrl } from '../../../constants/api';
import type { OpportunityApplicationResponse } from '../../../types/opportunityApplication';
import { Typography, Spacing, Radii } from '../../../theme';
import { HireActionButton } from './HireActionButton';
import { ContentCaptureColors as D } from './tokens';

interface CreatorApplicationCardProps {
  application: OpportunityApplicationResponse;
  /** This card's own request is in flight. */
  busy?: boolean;
  /** Any card's request is in flight — every action is locked so two can't race. */
  locked?: boolean;
  onAccept?: (application: OpportunityApplicationResponse) => void;
  onDecline?: (application: OpportunityApplicationResponse) => void;
  onChat?: (application: OpportunityApplicationResponse) => void;
}

/**
 * One creator who applied to the elder's opportunity (My Requests). Undecided
 * applications get Accept / Decline; once accepted (or booked) the elder can
 * open a chat with that creator.
 */
export const CreatorApplicationCard: React.FC<CreatorApplicationCardProps> = ({
  application,
  busy = false,
  locked = false,
  onAccept,
  onDecline,
  onChat,
}) => {
  const { t } = useTranslation('contentCapture');
  const name = application.creatorName?.trim() || t('creatorApps.creatorFallback');
  const isPending = application.status === 'PENDING';
  const canChat = application.status === 'APPROVED' || application.status === 'BOOKED';
  const isDeclined = application.status === 'REJECTED';

  const statusLabel = (() => {
    switch (application.status) {
      case 'APPROVED':
        return t('creatorApps.statusAccepted');
      case 'BOOKED':
        return t('creatorApps.statusBooked');
      case 'REJECTED':
        return t('creatorApps.statusDeclined');
      default:
        return t('creatorApps.statusPending');
    }
  })();

  return (
    <View style={[s.card, canChat && s.cardAccepted, isDeclined && s.cardDeclined]}>
      <View style={s.header}>
        <Avatar size={52} uri={resolveImageUrl(application.creatorPhotoUrl)} />
        <View style={s.identity}>
          <Text style={s.name} numberOfLines={2}>
            {name}
          </Text>
          <View style={[s.chip, canChat ? s.chipAccepted : isDeclined ? s.chipDeclined : s.chipPending]}>
            {canChat && <Check size={13} color={D.onPrimary} strokeWidth={3} />}
            <Text style={[s.chipText, canChat && { color: D.onPrimary }]}>{statusLabel}</Text>
          </View>
        </View>
      </View>

      <Text style={s.appliedTo}>{t('creatorApps.appliedTo', { title: application.title })}</Text>

      {isPending && (
        <View style={s.actions}>
          <HireActionButton
            label={busy ? t('creatorApps.accepting') : t('creatorApps.accept')}
            accessibilityLabel={t('creatorApps.acceptAria', { name })}
            variant="accent"
            loading={busy}
            disabled={locked && !busy}
            onPress={() => onAccept?.(application)}
          />
          <HireActionButton
            label={t('creatorApps.decline')}
            accessibilityLabel={t('creatorApps.declineAria', { name })}
            variant="secondary"
            disabled={locked}
            onPress={() => onDecline?.(application)}
          />
        </View>
      )}

      {canChat && (
        <HireActionButton
          label={t('creatorApps.chat', { name })}
          accessibilityLabel={t('creatorApps.chatAria', { name })}
          icon={MessageCircle}
          size="large"
          loading={busy}
          disabled={locked && !busy}
          onPress={() => onChat?.(application)}
        />
      )}
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
    gap: Spacing.md,
  },
  cardAccepted: { borderColor: D.primary, borderWidth: 2 },
  cardDeclined: { backgroundColor: D.surfaceContainerLow, opacity: 0.8 },

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

  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radii.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  chipPending: { backgroundColor: D.secondaryContainer },
  chipAccepted: { backgroundColor: D.primary },
  chipDeclined: { backgroundColor: D.surfaceVariant },
  chipText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
    lineHeight: 16,
    color: D.onSurface,
  },

  actions: { gap: Spacing.sm },
});

export default CreatorApplicationCard;
