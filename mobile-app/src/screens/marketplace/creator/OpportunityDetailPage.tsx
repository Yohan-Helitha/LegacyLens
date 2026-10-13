import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { CreatorTopAppBar } from '../../../components/CreatorTopAppBar';
import { opportunityApi } from '../../../services/api/opportunityApi';
import type { OpportunityDetailResponse } from '../../../types/opportunity';
import { resolveOpportunityImage, resolveAvatarImage } from '../../../utils/opportunityImages';
import { matchLevelLabel, showsMatchBadge } from '../../../utils/matchLevel';

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

/** Shown when an opportunity has no picture of its own, or its picture cannot be loaded (same one My Work uses). */
const GENERIC_HERO_IMAGE = require('../../../../assets/images/work/traditional-rice-menu.jpg');

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
  onApply: () => void;
  opportunityId: string | null;
}> = ({ onNavigate, onBack, onApply, opportunityId }) => {
  const [detail, setDetail] = useState<OpportunityDetailResponse | null>(
    opportunityId ? null : FALLBACK_DETAIL,
  );
  const [heroFailed, setHeroFailed] = useState(false);

  useEffect(() => {
    setHeroFailed(false);
    if (!opportunityId) {
      setDetail(FALLBACK_DETAIL);
      return;
    }
    setDetail(null);
    opportunityApi
      .getById(opportunityId)
      .then(setDetail)
      // Only fall back to placeholder content if the real fetch actually fails —
      // never show it while a real opportunity is still loading.
      .catch(() => setDetail(FALLBACK_DETAIL));
  }, [opportunityId]);

  if (!detail) {
    return (
      <SafeAreaView style={s.safeArea} edges={['top'] as const}>
        <StatusBar style="dark" />
        <CreatorTopAppBar variant="back" onBack={onBack} />
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={D.primary} />
        </View>
        <BottomNavBar activeTab="market" onNavigate={onNavigate} />
      </SafeAreaView>
    );
  }

  const facts: { key: string; icon: React.ReactNode; label: string; value: string }[] = [];
  if (detail.location) facts.push({ key: 'location', icon: <PinIcon />, label: 'Location', value: detail.location });
  if (detail.scheduledDate) {
    facts.push({ key: 'date', icon: <CalendarIcon />, label: 'Date', value: formatScheduledDate(detail.scheduledDate) });
  }
  if (detail.durationText) facts.push({ key: 'duration', icon: <ClockIcon />, label: 'Duration', value: detail.durationText });
  if (detail.timeWindowText) facts.push({ key: 'time', icon: <ClockIcon />, label: 'Time', value: detail.timeWindowText });
  facts.push({
    key: 'offered',
    icon: <CardIcon />,
    label: 'Payment',
    value: `LKR ${Math.round(detail.offeredAmount).toLocaleString('en-US')}`,
  });
  if (detail.language) facts.push({ key: 'language', icon: <LanguageIcon />, label: 'Language', value: detail.language });

  const heroSource = (heroFailed ? undefined : resolveOpportunityImage(detail.heroImageUrl)) ?? GENERIC_HERO_IMAGE;
  const preserveParagraphs = (detail.preservationGoal ?? '')
    .split(/\n\s*\n|\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <CreatorTopAppBar variant="back" onBack={onBack} />

      {/* Scrollable content */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image - full width, always shown */}
        <View style={s.heroWrapper}>
          <Image
            source={heroSource}
            style={s.heroImage}
            accessibilityLabel={detail.title}
            resizeMode="cover"
            onError={() => setHeroFailed(true)}
          />
        </View>

        {/* Details start on a sheet with rounded top corners, overlapping the picture's bottom edge */}
        <View style={s.sheet}>
        {/* Header: badge + category, title, short description */}
        {(detail.elderVerified || !!detail.category) && (
          <View style={s.tagRow}>
            {detail.elderVerified && (
              <View style={s.verifiedPill}>
                <Text style={s.verifiedPillStar}>{'✦'}</Text>
                <Text style={s.verifiedPillText}>Verified Heritage</Text>
              </View>
            )}
            {!!detail.category && <Text style={s.categoryText}>{detail.category}</Text>}
          </View>
        )}
        <Text style={s.pageHeading}>{detail.title}</Text>
        {!!detail.description && <Text style={s.pageSubtitle}>{detail.description}</Text>}

        {/* Key facts */}
        {facts.length > 0 && (
          <View style={s.factsCard}>
            {facts.map((fact) => (
              <View key={fact.key} style={s.factCell}>
                <View style={s.factLabelRow}>
                  {fact.icon}
                  <Text style={s.factLabel}>{fact.label}</Text>
                </View>
                <Text style={s.factValue}>{fact.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Why this matches the signed-in creator - from the creator -> opportunity algorithm */}
        {showsMatchBadge(detail.matchPercentage, detail.matchLevel) && !!detail.matchReasons?.length && (
          <View style={s.matchCard}>
            <View style={s.matchHeaderRow}>
              <Text style={s.matchPercent}>{detail.matchPercentage}% match</Text>
              <Text style={s.matchLevelText}>{matchLevelLabel(detail.matchLevel)}</Text>
            </View>
            <Text style={s.matchTitle}>Why this matches you</Text>
            {detail.matchReasons.map((reason) => (
              <View key={reason} style={s.matchReasonRow}>
                <Text style={s.matchCheck}>{'✓'}</Text>
                <Text style={s.matchReasonText}>{reason}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Knowledge Holder */}
        <Text style={s.sectionHeading}>Knowledge Holder</Text>
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

        {/* Preservation goal */}
        {preserveParagraphs.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionHeading}>What they want to preserve?</Text>
            {preserveParagraphs.map((paragraph, index) => (
              <Text key={index} style={s.bodyText}>{paragraph}</Text>
            ))}
          </View>
        )}

        {/* Tasks: What you'll do — numbered stepper */}
        {detail.tasks.length > 0 && (
          <View style={s.tasksSection}>
            <Text style={s.sectionHeading}>{'What you\'ll do'}</Text>
            {detail.tasks.map((task, index) => (
              <TaskStep key={index} index={index} text={task} isLast={index === detail.tasks.length - 1} />
            ))}
          </View>
        )}
        </View>
      </ScrollView>

      {/* Fixed Apply button (above nav bar) */}
      <View style={s.applyContainer}>
        <Pressable
          onPress={onApply}
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

  // ── Match ──────────────────────────────────────────────────────────────────
  matchCard: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: 6,
    marginBottom: Spacing.md,
  },
  matchHeaderRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  matchPercent: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG, color: D.primary },
  matchLevelText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.secondary },
  matchTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onSurface },
  matchReasonRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  matchCheck: { fontSize: 14, color: D.primary, lineHeight: 20 },
  matchReasonText: { flex: 1, fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 20, color: D.onSurfaceVariant },

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
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  scroll:        { flex: 1 },
  scrollContent: {
    paddingBottom: Spacing.md,
  },
  sheet: {
    marginTop: -28,
    backgroundColor: D.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },

  // ── Page heading ───────────────────────────────────────────────────────────
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E3F1E6',
    borderRadius: Radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#B9D9C0',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  verifiedPillStar: { fontSize: 12, color: '#2F6B3F' },
  verifiedPillText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: '#2F6B3F' },
  categoryText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.secondary },
  pageHeading: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size2XL,
    lineHeight: 40,
    color: D.onSurface,
    marginBottom: Spacing.sm,
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: D.onSurfaceVariant,
    marginBottom: Spacing.lg,
  },

  // ── Hero image ─────────────────────────────────────────────────────────────
  heroWrapper: {
    width: '100%',
    height: 360,
    backgroundColor: D.surfaceContainerHigh,
  },
  heroImage: { width: '100%', height: '100%' },

  // ── Section headings and body copy ─────────────────────────────────────────
  section: { marginBottom: Spacing.lg },
  sectionHeading: {
    fontFamily: Typography.fontDisplay,
    fontSize: 20,
    lineHeight: 28,
    color: D.onSurface,
    marginBottom: Spacing.sm,
  },
  bodyText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    lineHeight: 26,
    color: D.onSurfaceVariant,
    marginBottom: Spacing.md,
  },

  // ── Knowledge Holder card ──────────────────────────────────────────────────
  holderCard: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
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

  // ── Key facts card ─────────────────────────────────────────────────────────
  factsCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.lg,
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 1,
  },
  factCell: { width: '50%', gap: 4, paddingRight: Spacing.sm },
  factLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  factLabel: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },
  factValue: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, lineHeight: 22, color: D.onSurface },

  // ── Tasks — numbered stepper ───────────────────────────────────────────────
  tasksSection:      { gap: 0, marginBottom: Spacing.md },

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
