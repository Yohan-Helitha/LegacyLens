import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';
import { opportunityApi } from '../../../services/api/opportunityApi';
import type { OpportunityDetailResponse } from '../../../types/opportunity';
import { resolveOpportunityImage, resolveAvatarImage } from '../../../utils/opportunityImages';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens (HTML Tailwind colour system)
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  // Brand palette
  surface:                '#EDEFEE',           // 60% dominant
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow:    '#f0f5f5',
  surfaceContainer:       '#e4efef',
  surfaceContainerHigh:   '#d8e8e8',
  surfaceVariant:         '#c8dcdc',
  outlineVariant:         '#a0c4c4',

  primary:              '#0F5C5C',             // 30% teal
  onPrimary:            '#ffffff',
  primaryContainer:     '#0d4e4e',
  onPrimaryContainer:   '#e0f4f4',

  secondary:            '#E8792E',             // 10% orange accent
  onSecondary:          '#ffffff',
  secondaryContainer:   '#fff0e6',
  onSecondaryContainer: '#9e4a0d',

  tertiary:          '#202428',               // neutral dark
  tertiaryFixedDim:  '#E8792E',

  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',
  outline:          '#718096',
} as const;

/** Shown for an elder with no uploaded profile photo. */
const PLACEHOLDER_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBdukQOb20lmYsNjgSC79bwk6nR11u86Bj87jNIlc_ZQzQ97BxLNMhydins5gSF08W2CSQyNGsh4guyGBVX0htKvkNTzRAY76Yfv8jK-W-9Z-cW30fTc-tVqTE_3MXVnOr3daWdokTEReYQUt-ciXqQB8LF7qkH10d4SgSRvnxi4hdlzLG5RUNcZvLxKkHwfHK5wXsfSfaNkQJdZelcgow41KGgsq77Fkd9zgLSrunJwEJsg3U5ZQcTdg';

// ─────────────────────────────────────────────────────────────────────────────
// Icons — outline-style, always drawn in the orange accent so their colour
// isn't at the mercy of an emoji glyph's own built-in colouring.
// ─────────────────────────────────────────────────────────────────────────────
type IconProps = { size?: number; color?: string };

const PinIcon: React.FC<IconProps> = ({ size = 14, color = '#E8792E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

const ClockIcon: React.FC<IconProps> = ({ size = 14, color = '#E8792E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="9" />
    <Path d="M12 7v5l3.5 2" />
  </Svg>
);

const CalendarIcon: React.FC<IconProps> = ({ size = 14, color = '#E8792E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="5" width="18" height="16" rx="2" />
    <Line x1="16" y1="3" x2="16" y2="7" />
    <Line x1="8" y1="3" x2="8" y2="7" />
    <Line x1="3" y1="10" x2="21" y2="10" />
  </Svg>
);

const CardIcon: React.FC<IconProps> = ({ size = 14, color = '#E8792E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="5" width="20" height="14" rx="2" />
    <Line x1="2" y1="10" x2="22" y2="10" />
  </Svg>
);

const LanguageIcon: React.FC<IconProps> = ({ size = 14, color = '#E8792E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.8-.9L4 21l1.9-4.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 13.5 4 8.5 8.5 0 0 1 21 11.5z" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Fallback data — shown while opportunityId is unset or the
// /api/opportunities/{id} call fails, so the screen never renders blank.
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_DETAIL: OpportunityDetailResponse = {
  id: '',
  title: 'Opportunity Details',
  description: '',
  heroImageUrl: 'local:fisheries',
  elderName: 'Mrs. Kamala Wijesinghe',
  elderAvatarUrl: null,
  elderVerified: true,
  location: 'Matara',
  scheduledDate: null,
  durationText: '3 - 4 h',
  offeredAmount: 3500,
  timeWindowText: '10.00 AM – 1.00 PM',
  language: 'Sinhala',
  preservationGoal:
    'I would like to preserve how my family prepare this traditional recipe. I want someone to record this preparation including all the instruction and create a video that can be shared with younger generation.',
  tasks: [
    'Visit the knowledge holder in Matara.',
    'Record the preparation process comprehensively.',
    'Capture high-quality photos and video clip.',
    'Document step-by-step instructions clearly.',
    'Edit and submit the final video',
  ],
};

function formatScheduledDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
// TopAppBar  (back arrow + title + bell)
// ─────────────────────────────────────────────────────────────────────────────
const TopAppBar: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <View style={s.appBar}>
    <Pressable
      style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}
      onPress={onBack}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Text style={s.backArrow}>{'←'}</Text>
    </Pressable>

    <Text style={s.appBarTitle}>Legacy Lens</Text>

    <Pressable
      style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Notifications"
    >
      <View style={s.bellWrapper}>
        <View style={s.bellTop} />
        <View style={s.bellBody} />
        <View style={s.bellClapper} />
      </View>
    </Pressable>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// TaskStep — numbered stepper row (replaces the old plain checkmark list)
// ─────────────────────────────────────────────────────────────────────────────
const TaskStep: React.FC<{ index: number; text: string; isLast: boolean }> = ({ index, text, isLast }) => (
  <View style={s.taskStepRow}>
    <View style={s.taskStepBadgeCol}>
      <View style={s.taskStepBadge}>
        <Text style={s.taskStepBadgeText}>{index + 1}</Text>
      </View>
      {!isLast && <View style={s.taskStepLine} />}
    </View>
    <View style={s.taskStepCard}>
      <Text style={s.taskStepText}>{text}</Text>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const OpportunityDetailPage: React.FC<{
  onNavigate: (tab: NavTab) => void;
  onBack: () => void;
  opportunityId: string | null;
}> = ({ onNavigate, onBack, opportunityId }) => {
  const [detail, setDetail] = useState<OpportunityDetailResponse>(FALLBACK_DETAIL);

  useEffect(() => {
    if (!opportunityId) return;
    opportunityApi
      .getById(opportunityId)
      .then(setDetail)
      .catch(() => {});
  }, [opportunityId]);

  const chips: { key: string; icon: React.ReactNode; value: string }[] = [];
  if (detail.location) chips.push({ key: 'location', icon: <PinIcon />, value: detail.location });
  if (detail.durationText) chips.push({ key: 'duration', icon: <ClockIcon />, value: detail.durationText });
  chips.push({
    key: 'offered',
    icon: <CardIcon />,
    value: `LKR ${Math.round(detail.offeredAmount).toLocaleString('en-US')}`,
  });
  if (detail.scheduledDate) {
    chips.push({ key: 'date', icon: <CalendarIcon />, value: formatScheduledDate(detail.scheduledDate) });
  }
  if (detail.timeWindowText) chips.push({ key: 'time', icon: <ClockIcon />, value: detail.timeWindowText });
  if (detail.language) chips.push({ key: 'language', icon: <LanguageIcon />, value: detail.language });

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <TopAppBar onBack={onBack} />

      {/* Scrollable content */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page heading */}
        <Text style={s.breadcrumb}>Opportunity Details.....</Text>
        <Text style={s.pageHeading}>{detail.title}</Text>

        {/* Hero image */}
        <View style={s.heroWrapper}>
          <Image
            source={resolveOpportunityImage(detail.heroImageUrl)}
            style={s.heroImage}
            accessibilityLabel={detail.title}
            resizeMode="cover"
          />
        </View>

        {/* Knowledge Holder card */}
        <Pressable
          style={({ pressed }) => [s.holderCard, pressed && s.cardPressed]}
          accessibilityRole="button"
          accessibilityLabel={`View ${detail.elderName}'s profile`}
        >
          <View style={s.holderLeft}>
            <Image
              source={resolveAvatarImage(detail.elderAvatarUrl) ?? { uri: PLACEHOLDER_AVATAR }}
              style={s.holderAvatar}
              accessibilityLabel={`${detail.elderName} portrait`}
            />
            <View style={s.holderInfo}>
              <Text style={s.holderName}>{detail.elderName}</Text>
              {detail.elderVerified && (
                <View style={s.holderBadgeRow}>
                  <Text style={s.verifiedStar}>{'✦'}</Text>
                  <Text style={s.holderBadgeText}>Verified Knowledge holder</Text>
                </View>
              )}
            </View>
          </View>
          <View style={s.chevronBtn}>
            <Text style={s.chevronText}>{'›'}</Text>
          </View>
        </Pressable>

        {/* Key info — compact pill chips, not big bento boxes */}
        {chips.length > 0 && (
          <View style={s.infoChipsRow}>
            {chips.map((c) => (
              <View key={c.key} style={s.infoChip}>
                <View style={s.infoChipIconBox}>{c.icon}</View>
                <Text style={s.infoChipText} numberOfLines={1}>{c.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Preservation Goal quote card */}
        {detail.preservationGoal && (
          <View style={s.quoteCard}>
            <Text style={s.quoteLargeDecor}>{'“'}</Text>

            <Text style={s.quoteCardTitle}>What they want to preserve?</Text>
            <Text style={s.quoteCardText}>{`“${detail.preservationGoal}”`}</Text>
          </View>
        )}

        {/* Tasks: What you'll do — numbered stepper */}
        {detail.tasks.length > 0 && (
          <View style={s.tasksSection}>
            <Text style={s.tasksSectionTitle}>{'What you\'ll do'}</Text>
            {detail.tasks.map((task, index) => (
              <TaskStep key={index} index={index} text={task} isLast={index === detail.tasks.length - 1} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Fixed Apply button (above nav bar) */}
      <View style={s.applyContainer}>
        <Pressable
          style={({ pressed }) => [s.applyBtn, pressed && s.applyBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Apply for this opportunity"
        >
          <Text style={s.applyBtnText}>Apply</Text>
          <Text style={s.applyArrow}>{'→'}</Text>
        </Pressable>
      </View>

      <BottomNavBar activeTab="market" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

export default OpportunityDetailPage;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },

  // ── App Bar ────────────────────────────────────────────────────────────────
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 56,
    backgroundColor: D.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: D.surfaceVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: Radii.full,
    alignItems: 'center', justifyContent: 'center',
  },
  appBarTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG,
    lineHeight: Typography.sizeLG * 1.4,
    color: D.primary,
    letterSpacing: -0.3,
  },
  backArrow: { fontSize: 20, color: D.primary, lineHeight: 24 },
  bellWrapper:  { alignItems: 'center' },
  bellTop:      { width: 3, height: 3, borderRadius: 1.5, backgroundColor: D.primary, marginBottom: 1 },
  bellBody:     { width: 14, height: 13, borderWidth: 1.5, borderColor: D.primary, borderRadius: 7, borderBottomWidth: 0 },
  bellClapper:  { width: 5, height: 2, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, backgroundColor: D.primary },

  // ── Scroll ─────────────────────────────────────────────────────────────────
  scroll:        { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },

  // ── Page heading ───────────────────────────────────────────────────────────
  breadcrumb: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: D.onSurfaceVariant,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  pageHeading: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXL,      // 24sp — h1
    lineHeight: 30,
    color: D.onSurface,
    marginBottom: Spacing.md,
    letterSpacing: -0.2,
  },

  // ── Hero image ─────────────────────────────────────────────────────────────
  heroWrapper: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  heroImage: { width: '100%', height: '100%' },

  // ── Knowledge Holder card ──────────────────────────────────────────────────
  holderCard: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 1,
  },
  holderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  holderAvatar: {
    width: 48, height: 48, borderRadius: 24, overflow: 'hidden',
    backgroundColor: D.surfaceContainerHigh, flexShrink: 0,
  },
  holderInfo:      { flex: 1 },
  holderName:      { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.onSurface, lineHeight: 24 },
  holderBadgeRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  verifiedStar:    { fontSize: 14, color: '#E8792E' },
  holderBadgeText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },
  chevronBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#E8792E',
    alignItems: 'center', justifyContent: 'center',
  },
  chevronText: { fontSize: 18, color: '#ffffff', lineHeight: 22, fontFamily: Typography.fontBodySemi },
  cardPressed: { opacity: 0.9 },

  // ── Info chips (compact — not big boxes) ───────────────────────────────────
  infoChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  infoChipIconBox: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(232, 121, 46, 0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  infoChipText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,      // 14sp
    color: D.onSurface,
  },

  // ── Preservation Quote card ────────────────────────────────────────────────
  quoteCard: {
    backgroundColor: D.surfaceContainerLow,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: D.primary,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  quoteLargeDecor: {
    position: 'absolute',
    top: -16,
    right: -8,
    fontSize: 120,
    lineHeight: 120,
    color: D.surfaceVariant,
    opacity: 0.3,
    fontFamily: Typography.fontDisplay,
  },
  quoteCardTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,      // 16sp
    color: '#0F5C5C',                 // teal heading (30% rule)
    marginBottom: Spacing.sm,
    lineHeight: 24,
  },
  quoteCardText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,      // 16sp — body
    lineHeight: 26,
    color: D.onSurfaceVariant,
    fontStyle: 'italic',
  },

  // ── Tasks — numbered stepper ───────────────────────────────────────────────
  tasksSection:      { gap: 0 },
  tasksSectionTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeLG,      // 18sp — section heading
    color: D.onSurface,
    lineHeight: 28,
    marginBottom: Spacing.sm,
  },
  taskStepRow:    { flexDirection: 'row', gap: Spacing.sm },
  taskStepBadgeCol: { alignItems: 'center', width: 28 },
  taskStepBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#E8792E',
    alignItems: 'center', justifyContent: 'center',
  },
  taskStepBadgeText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 13,
    color: '#ffffff',
  },
  taskStepLine: {
    flex: 1,
    width: 2,
    minHeight: 14,
    backgroundColor: 'rgba(232, 121, 46, 0.25)',
    marginVertical: 2,
  },
  taskStepCard: {
    flex: 1,
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: Spacing.sm,
  },
  taskStepText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,      // 14sp
    lineHeight: 22,
    color: D.onSurface,
  },

  // ── Apply button (fixed above nav) ─────────────────────────────────────────
  applyContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 4,
    backgroundColor: 'transparent',
  },
  applyBtn: {
    width: '100%',
    backgroundColor: '#0F5C5C',       // teal (30% — primary action)
    borderRadius: Radii.xl,
    paddingVertical: 16,              // 16+16+~24 line = 56pt — prominent CTA
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: '#0F5C5C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  applyBtnPressed: { opacity: 0.88, elevation: 2 },
  applyBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,      // 16sp — button text
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  applyArrow: { fontSize: 20, color: '#ffffff', lineHeight: 24 },

  // ── Press feedback ─────────────────────────────────────────────────────────
  pressed: { opacity: 0.72 },
});
