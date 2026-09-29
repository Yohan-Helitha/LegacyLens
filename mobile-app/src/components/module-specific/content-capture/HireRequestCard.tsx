import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MessageCircle, Users } from 'lucide-react-native';
import { Avatar } from '../../common';
import { useHireStrings } from '../../../hooks/useHireStrings';
import type { HireRequestItem } from '../../../hooks/useHireRequests';
import { Typography, Spacing, Radii } from '../../../theme';
import { HireActionButton } from './HireActionButton';
import { HireStatusPill } from './HireStatusPill';
import { ContentCaptureColors as D } from './tokens';

interface HireRequestCardProps {
  item: HireRequestItem;
  onViewApplicants?: (item: HireRequestItem) => void;
  onMessage?: (item: HireRequestItem) => void;
}

/**
 * One posted request on My Requests (Screen 9): status pill, a short
 * snippet, and the single next action for that status — "View Applicants"
 * once creators have applied, or the assigned creator with a "Message"
 * button once one is chosen. Every other status is informational only.
 */
export const HireRequestCard: React.FC<HireRequestCardProps> = ({ item, onViewApplicants, onMessage }) => {
  const { t, formatDate } = useHireStrings();
  const statusLabel = t(`requests.status.${item.displayStatus}`);
  const snippet = (item.description?.trim() || item.title).replace(/\s+/g, ' ');
  const creatorName = item.assignedCreator?.name ?? t('requests.creatorFallback');
  const posted = formatDate(item.createdAt);

  return (
    <View style={s.card}>
      <View style={s.topRow}>
        <HireStatusPill
          status={item.displayStatus}
          label={statusLabel}
          accessibilityLabel={t('requests.statusAccessibility', { status: statusLabel })}
        />
        {!!posted && <Text style={s.date}>{t('requests.posted', { date: posted })}</Text>}
      </View>

      <Text style={s.snippet} numberOfLines={3}>
        {snippet}
      </Text>

      {item.displayStatus === 'REVIEWING' && (
        <HireActionButton
          label={t('requests.viewApplicants', { count: item.applicantCount })}
          icon={Users}
          onPress={() => onViewApplicants?.(item)}
        />
      )}

      {item.displayStatus === 'ASSIGNED' && (
        <View style={s.creatorRow}>
          <Avatar size={44} />
          <View style={s.creatorText}>
            <Text style={s.creatorCaption}>{t('requests.assignedCreator')}</Text>
            <Text style={s.creatorName} numberOfLines={2}>
              {creatorName}
            </Text>
          </View>
          <HireActionButton
            label={t('requests.message')}
            accessibilityLabel={t('requests.messageAccessibility', { name: creatorName })}
            icon={MessageCircle}
            onPress={() => onMessage?.(item)}
            style={s.messageBtn}
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  date: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: D.onSurfaceVariant,
  },
  snippet: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: D.onSurface,
  },

  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: D.outlineVariant,
  },
  creatorText: { flex: 1, minWidth: 120, gap: 2 },
  creatorCaption: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: D.onSurfaceVariant,
  },
  creatorName: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    lineHeight: 22,
    color: D.onSurface,
  },
  messageBtn: { paddingHorizontal: Spacing.md },
});

export default HireRequestCard;
