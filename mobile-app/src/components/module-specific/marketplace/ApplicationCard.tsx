import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { Typography, Spacing, Radii } from '../../../theme';
import type { OpportunityApplicationResponse } from '../../../types/opportunityApplication';
import { opportunityApplicationApi } from '../../../services/api/opportunityApplicationApi';
import { ApiError } from '../../../services/api/client';
import { resolveOpportunityImage } from '../../../utils/opportunityImages';
import { formatStamp } from '../../../utils/applicationDates';

// Shown when an opportunity has no picture of its own, or its picture cannot be loaded.
const GENERIC_HERO_IMAGE = require('../../../../assets/images/work/traditional-rice-menu.jpg');

const D = {
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow:    '#f0f5f5',
  surfaceVariant:         '#c8dcdc',

  primary:              '#0F5C5C',
  secondary:            '#E8792E',

  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',
} as const;

/** Colours for each stage of an application, so the status reads at a glance. */
const STATUS_STYLES: Record<string, { label: string; background: string; text: string }> = {
  SAVED:    { label: 'Saved',    background: '#E3F1F0', text: '#0F5C5C' },
  PENDING:  { label: 'Pending',  background: '#FFF0E0', text: '#9E4A0D' },
  REJECTED: { label: 'Rejected', background: '#FDECEA', text: '#B3261E' },
};

function formatScheduledDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
type IconProps = { size?: number; color?: string };

const PinIcon: React.FC<IconProps> = ({ size = 13, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

const CalendarIcon: React.FC<IconProps> = ({ size = 13, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="5" width="18" height="16" rx="2" />
    <Line x1="16" y1="3" x2="16" y2="7" />
    <Line x1="8" y1="3" x2="8" y2="7" />
    <Line x1="3" y1="10" x2="21" y2="10" />
  </Svg>
);

const ClockIcon: React.FC<IconProps> = ({ size = 13, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="9" />
    <Path d="M12 7v5l3.5 2" />
  </Svg>
);

const CardIcon: React.FC<IconProps> = ({ size = 13, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="5" width="20" height="14" rx="2" />
    <Line x1="2" y1="10" x2="22" y2="10" />
  </Svg>
);

const TrashIcon: React.FC<IconProps> = ({ size = 18, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="4" y1="7" x2="20" y2="7" />
    <Path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
    <Line x1="9" y1="4" x2="15" y2="4" />
    <Line x1="10" y1="11" x2="10" y2="17" />
    <Line x1="14" y1="11" x2="14" y2="17" />
  </Svg>
);

/** The bin icon on a card: asks first, then removes the application on the server and tells the page to reload. */
export const DeleteApplicationButton: React.FC<{
  record: OpportunityApplicationResponse;
  onDeleted: () => void;
}> = ({ record, onDeleted }) => {
  const confirmDelete = () => {
    Alert.alert(
      'Delete this application?',
      `"${record.title}" will be removed${record.status === 'SAVED' ? ' from your saved drafts' : ''}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await opportunityApplicationApi.remove(record.id);
              onDeleted();
            } catch (err) {
              const message = err instanceof ApiError ? err.message : 'Could not delete this application.';
              Alert.alert('Delete failed', message);
            }
          },
        },
      ],
    );
  };

  return (
    <Pressable
      onPress={confirmDelete}
      style={({ pressed }) => [s.trashBtn, pressed && s.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Delete ${record.title}`}
    >
      <TrashIcon />
    </Pressable>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const look = STATUS_STYLES[status] ?? STATUS_STYLES.SAVED;
  return (
    <View style={[s.badge, { backgroundColor: look.background }]}>
      <Text style={[s.badgeText, { color: look.text }]}>{look.label}</Text>
    </View>
  );
};

/** The opportunity's picture, or the default photo when it has none or it cannot load. */
const Thumb: React.FC<{ heroImageUrl: string | null; title: string }> = ({ heroImageUrl, title }) => {
  const [failed, setFailed] = useState(false);
  return (
    <Image
      source={(failed ? undefined : resolveOpportunityImage(heroImageUrl)) ?? GENERIC_HERO_IMAGE}
      style={s.thumb}
      resizeMode="cover"
      accessibilityLabel={title}
      onError={() => setFailed(true)}
    />
  );
};

/**
 * One application, laid out like the opportunity card on the Apply screen: picture, title, elder
 * and place, then a date / payment strip - plus when it was saved or submitted.
 */
export const ApplicationSummary: React.FC<{
  record: OpportunityApplicationResponse;
  trailing?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ record, trailing, children }) => {
  const isDraft = record.status === 'SAVED';
  const stamp = formatStamp(isDraft ? record.savedAt : record.submittedAt ?? record.savedAt);

  return (
    <View style={s.card}>
      <View style={s.cardTopRow}>
        <StatusBadge status={record.status} />
        {trailing}
      </View>

      <View style={s.summaryRow}>
        <Thumb heroImageUrl={record.heroImageUrl} title={record.title} />
        <View style={s.summaryText}>
          <Text style={s.cardTitle} numberOfLines={3}>{record.title}</Text>
          <Text style={s.elderName} numberOfLines={1}>{record.elderName}</Text>
          {!!record.location && (
            <View style={s.inline}>
              <PinIcon />
              <Text style={s.inlineText} numberOfLines={1}>{record.location}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={s.strip}>
        <View style={s.stripRow}>
          <View style={s.inline}>
            <CalendarIcon />
            <Text style={s.stripText}>{formatScheduledDate(record.scheduledDate)}</Text>
          </View>
          <View style={s.inline}>
            <CardIcon />
            <Text style={s.stripText}>{`LKR ${Math.round(record.offeredAmount).toLocaleString('en-US')}`}</Text>
          </View>
        </View>
        {!!record.timeWindowText && (
          <View style={s.inline}>
            <ClockIcon />
            <Text style={s.stripText}>{record.timeWindowText}</Text>
          </View>
        )}
      </View>

      {!!stamp && (
        <View style={s.stampRow}>
          <ClockIcon size={12} color={D.onSurfaceVariant} />
          <Text style={s.stampText}>{`${isDraft ? 'Saved' : 'Submitted'} on ${stamp}`}</Text>
        </View>
      )}

      {children}
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    gap: Spacing.sm,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 28 },
  badge: { borderRadius: Radii.full, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, letterSpacing: 0.3 },
  summaryRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  thumb: {
    width: 84, height: 84, borderRadius: Radii.lg,
    backgroundColor: D.surfaceContainerLow,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
  },
  summaryText: { flex: 1, gap: 4 },
  cardTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, lineHeight: 20, color: D.onSurface },
  elderName: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurface },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inlineText: { flex: 1, fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurface },
  strip: {
    backgroundColor: D.surfaceContainerLow, borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
    paddingVertical: 8, paddingHorizontal: 12, gap: 6,
  },
  stripRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stripText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurface },
  stampRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 2 },
  stampText: { fontFamily: Typography.fontBodyMed, fontSize: 11, color: D.onSurfaceVariant },
  trashBtn: { padding: 6 },
  pressed: { opacity: 0.75 },
});
