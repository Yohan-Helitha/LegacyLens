import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MessageCircle, Trash2, Users } from 'lucide-react-native';
import { Avatar } from '../../common';
import { useHireStrings } from '../../../hooks/useHireStrings';
import type { HireRequestItem } from '../../../hooks/useHireRequests';
import { isHireRequestDeletable } from '../../../utils/hireRequest';
import { getMediaUrl } from '../../../constants/api';
import { Typography, Spacing, Radii } from '../../../theme';
import { HireActionButton } from './HireActionButton';
import { HireStatusPill } from './HireStatusPill';
import { MediaPreviewCard } from './MediaPreviewCard';
import { ContentCaptureColors as D } from './tokens';

interface HireRequestCardProps {
  item: HireRequestItem;
  onViewApplicants?: (item: HireRequestItem) => void;
  onMessage?: (item: HireRequestItem) => void;
  /** Asks to delete this request — the confirm dialog lives on the screen, not here. */
  onRequestDelete?: (item: HireRequestItem) => void;
  /** This card's own delete is in flight. */
  deleting?: boolean;
}

/**
 * One posted request on My Requests (Screen 9): status pill, the full
 * snippet, a playable copy of the recorded Details clip right on the card
 * (no separate page needed just to check what was sent), and the single
 * next action for the status — "View Applicants" once creators have
 * applied, or the assigned creator with a "Message" button once one is
 * chosen. A Delete option is always shown but only enabled for the first
 * hour after posting, and only before an admin has acted on it — see
 * isHireRequestDeletable.
 */
export const HireRequestCard: React.FC<HireRequestCardProps> = ({
  item,
  onViewApplicants,
  onMessage,
  onRequestDelete,
  deleting = false,
}) => {
  const { t, formatDate } = useHireStrings();
  const statusLabel = t(`requests.status.${item.displayStatus}`);
  const snippet = (item.description?.trim() || item.title).replace(/\s+/g, ' ');
  const creatorName = item.assignedCreator?.name ?? t('requests.creatorFallback');
  const posted = formatDate(item.createdAt);
  const canDelete = isHireRequestDeletable(item.status, item.createdAt) && !deleting;

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

      <Text style={s.snippet}>{snippet}</Text>

      {!!item.voiceNoteUrl && <MediaPreviewCard mediaType="AUDIO" uri={getMediaUrl(item.voiceNoteUrl)} />}

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

      <Pressable
        onPress={() => canDelete && onRequestDelete?.(item)}
        disabled={!canDelete}
        style={({ pressed }) => [s.deleteRow, pressed && canDelete && s.deletePressed]}
        accessibilityRole="button"
        accessibilityLabel={canDelete ? t('requests.deleteAccessibility') : t('requests.deleteWindowPassedAccessibility')}
        accessibilityState={{ disabled: !canDelete }}
      >
        {deleting ? (
          <ActivityIndicator size="small" color={D.onSurfaceVariant} />
        ) : (
          <Trash2 size={16} color={canDelete ? '#ba1a1a' : D.outlineVariant} strokeWidth={2} />
        )}
        <Text style={[s.deleteText, !canDelete && s.deleteTextDisabled]}>
          {deleting ? t('requests.deleting') : t('requests.deleteAction')}
        </Text>
      </Pressable>
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

  // Deliberately lightweight (not a full HireActionButton) — deleting is a
  // rare, secondary action and shouldn't visually compete with the card's
  // primary status-driven action above it.
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: Spacing.xs,
    marginTop: -Spacing.xs,
    marginHorizontal: -Spacing.xs,
  },
  deletePressed: { opacity: 0.7 },
  deleteText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    color: '#ba1a1a',
  },
  deleteTextDisabled: { color: D.outlineVariant },
});

export default HireRequestCard;
