import React, { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';

// ─────────────────────────────────────────────────────────────────────────────
// Local design tokens (mapped from HTML Tailwind config colour system)
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  // ── 60% dominant — surfaces
  surface:                '#EDEFEE',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow:    '#f0f5f5',
  surfaceContainer:       '#e4efef',
  surfaceContainerHigh:   '#d8e8e8',
  surfaceVariant:         '#c8dcdc',

  // ── 30% primary — teal
  primary:              '#0F5C5C',
  onPrimary:            '#ffffff',

  // ── 10% accent — orange
  secondary:            '#E8792E',
  onSecondary:          '#ffffff',
  secondaryContainer:   '#fff0e6',
  onSecondaryContainer: '#9e4a0d',
  secondaryFixedDim:    'rgba(232,121,46,0.30)',

  // ── Tertiary — gold for star ratings
  tertiaryContainer: '#E8792E',         // reuse orange for stars

  // ── Text
  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type JobTab = 'active' | 'upcoming' | 'completed';

// ─────────────────────────────────────────────────────────────────────────────
// Minimal inline icons (emoji-based, zero extra dependencies)
// ─────────────────────────────────────────────────────────────────────────────
const StarIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <Text style={{ fontSize: size, color, lineHeight: size + 2 }}>★</Text>
);

// ─────────────────────────────────────────────────────────────────────────────
// TopAppBar
// ─────────────────────────────────────────────────────────────────────────────
const TopAppBar: React.FC = () => (
  <View style={s.appBar}>
    <Pressable
      style={({ pressed }) => [s.appBarIconBtn, pressed && s.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
    >
      <View style={s.hamburger}>
        <View style={s.hamburgerLine} />
        <View style={s.hamburgerLine} />
        <View style={s.hamburgerLine} />
      </View>
    </Pressable>

    <Text style={s.appBarTitle}>Legacy Lens</Text>

    <Pressable
      style={({ pressed }) => [s.appBarIconBtn, pressed && s.pressed]}
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
// GreetingSection
// ─────────────────────────────────────────────────────────────────────────────
const GreetingSection: React.FC = () => (
  <View style={s.greetingRow}>
    <Image
      source={{
        uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdmWxeiutm8VuCuwb8B-bcbY4uwLEOEIZpHad16sSCOnOCn176-8moOj3W6uDPAciix85yHVNmpAd1RTzDZNIib4AVMq68gwoQfyYec-CiNygpv3Rti52MfEWixskGSi9K2HzQJc1XhIg649C9xWHdmBqgXNA5LsR-CP4PfF7fUKsBLElU0twICuF7-ZcI9Vlnj9GgnzoL4Bqj9ilpxA4BZs3oFt_0h7PcPdk4HDm4JKWKr6S3bofO2g',
      }}
      style={s.avatar}
      accessibilityLabel="Inothma's profile photo"
    />
    <View style={s.greetingText}>
      <Text style={s.greetingHeadline}>Good Morning, Inothma 👋</Text>
      <Text style={s.greetingSubtitle}>Ready to preserve a story today?</Text>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// MetricsSection  (stats card + balance card)
// ─────────────────────────────────────────────────────────────────────────────
const MetricsSection: React.FC = () => (
  <View style={s.metricsGrid}>
    {/* ── Stats row ─────────────────────────────────────────────────────── */}
    <View style={s.statsCard}>
      <View style={s.ratingRow}>
        <Text style={s.ratingValue}>4.8</Text>
        <StarIcon size={20} color={D.tertiaryContainer} />
      </View>
      <View style={s.statsRight}>
        <Text style={s.statsJobCount}>24 completed jobs</Text>
        <Text style={s.statsContrib}>38 contributions</Text>
      </View>
    </View>

    {/* ── Balance card ──────────────────────────────────────────────────── */}
    <View style={s.balanceCard}>
      {/* decorative glow blob */}
      <View style={s.balanceGlow} pointerEvents="none" />

      <Text style={s.balanceLabel}>AVAILABLE BALANCE</Text>
      <Text style={s.balanceAmount}>LKR 42,500</Text>

      <View style={s.balanceBtnRow}>
        <Pressable
          style={({ pressed }) => [s.balanceBtnOutline, pressed && s.pressedDark]}
          accessibilityRole="button"
        >
          <Text style={s.balanceBtnOutlineText}>History</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [s.balanceBtnFill, pressed && s.pressedLight]}
          accessibilityRole="button"
        >
          <Text style={s.balanceBtnFillText}>Withdraw</Text>
        </Pressable>
      </View>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// TabPill
// ─────────────────────────────────────────────────────────────────────────────
const TabPill: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
}> = ({ label, active, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      s.tabPill,
      active ? s.tabPillActive : s.tabPillInactive,
      pressed && s.pressed,
    ]}
    accessibilityRole="tab"
    accessibilityState={{ selected: active }}
  >
    <Text style={[s.tabPillText, active && s.tabPillTextActive]}>{label}</Text>
  </Pressable>
);

// ─────────────────────────────────────────────────────────────────────────────
// ActiveJobCard
// ─────────────────────────────────────────────────────────────────────────────
const ActiveJobCard: React.FC = () => (
  <Pressable
    style={({ pressed }) => [s.jobCard, pressed && s.jobCardPressed]}
    accessibilityRole="button"
    accessibilityLabel="Recording Local History — In Progress"
  >
    {/* Header */}
    <View style={s.jobCardHeader}>
      <View style={s.jobCardLeft}>
        <View style={s.jobIconBox}>
          <Text style={{ fontSize: 18 }}>🎥</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.jobTitle}>Recording Local History</Text>
          <Text style={s.jobClient}>Mrs. Kamala Wijesinghe</Text>
        </View>
      </View>
      <View style={s.jobStatusBadge}>
        <Text style={s.jobStatusText}>IN PROGRESS</Text>
      </View>
    </View>

    {/* Description */}
    <Text style={s.jobDesc} numberOfLines={2}>
      Recording oral history regarding the 1970s textile industry in Colombo,
      focusing on traditional methods and personal anecdotes.
    </Text>

    {/* Meta footer */}
    <View style={s.jobMeta}>
      <View style={s.jobMetaItem}>
        <Text style={[s.jobMetaText, { fontSize: 13 }]}>📍</Text>
        <Text style={s.jobMetaText}>Colombo South</Text>
      </View>
      <View style={s.jobMetaItem}>
        <Text style={[s.jobMetaText, { fontSize: 13 }]}>🕐</Text>
        <Text style={[s.jobMetaText, { color: D.secondary }]}>Due in 3 days</Text>
      </View>
    </View>
  </Pressable>
);

// ─────────────────────────────────────────────────────────────────────────────
// FeedbackSection
// ─────────────────────────────────────────────────────────────────────────────
const FeedbackSection: React.FC = () => (
  <View style={s.section}>
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>Client Feedback</Text>
      <View style={s.ratingRow}>
        <Text style={s.feedbackRating}>4.8</Text>
        <StarIcon size={16} color={D.tertiaryContainer} />
      </View>
    </View>

    <View style={s.feedbackCard}>
      {/* Decorative large quote mark */}
      <Text style={s.quoteDecor}>{'“'}</Text>
      {/* Left accent bar */}
      <View style={s.quoteBar} />
      <Text style={s.quoteText}>
        {'“Incredibly patient and captured my grandmother’s stories perfectly. The audio quality is fantastic.”'}
      </Text>
      <Text style={s.quoteAuthor}>{'— Surangi D.'}</Text>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// RecentWorkSection
// ─────────────────────────────────────────────────────────────────────────────
const RecentWorkSection: React.FC = () => (
  <View style={s.section}>
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>Recent Work</Text>
      <Pressable
        style={({ pressed }) => pressed ? [s.pressed] : []}
        accessibilityRole="button"
      >
        <Text style={s.viewAllText}>View All ›</Text>
      </Pressable>
    </View>

    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.galleryRow}
    >
      {/* Item 1 — photo */}
      <View style={s.galleryItem}>
        <Image
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFW8GttPpMm6K31LoPiO2qge-q_zKOB5ejaEiR2henn4R0Y6xu3Y0_4TprvW49cHxCaKDSBDqrAx4w1awmOabnlqhloVzfy47V-73rVfUwQ569zfyWt1TVdrCAzHLcj2f6i2w33GaOhDBBqOYUfamZYNxZS5iPV1mpM1_lk5iktNNZF-rAUngLXiDRIE3gfCwUgMvUhaoG2zsRvN2SEYpIHFfB3ZUwVwaRT3769C2-mO9lF31TTJpOjQ' }}
          style={s.galleryImage}
          accessibilityLabel="Traditional Sri Lankan pottery making"
        />
        <View style={s.galleryOverlayGradient} />
        <Text style={s.galleryTypeIcon}>🖼</Text>
      </View>

      {/* Item 2 — video */}
      <View style={s.galleryItem}>
        <Image
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQnCcXKdj5Mpxq_U6HbRfpzHP0DAe6slNvaM2l9rgQaOM3HtNRQYk5YUOaDHcrf83ORsJKRq1dVseST4YukxaHSx8g3-VbVCK81hzEHMVsRsYzRzwIbRq3C9TYz6Pw01byckdwEHGucierqanIjiXunyjk9YRJL6rptLLqQ1PAytafYAhGb0SLHLEamnE_t90KAadoYsnqtm7-XYF-V8GZpqEFsH2UZdVtrbSl83LQvrltp26CpuLC2Q' }}
          style={s.galleryImage}
          accessibilityLabel="Sri Lankan street food documentary thumbnail"
        />
        <View style={s.galleryOverlayDark} />
        <View style={s.playBtnWrapper}>
          <View style={s.playBtn}>
            <Text style={{ fontSize: 16, color: D.secondary, marginLeft: 2 }}>▶</Text>
          </View>
        </View>
      </View>

      {/* Item 3 — photo */}
      <View style={s.galleryItem}>
        <Image
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFPF4ea2tWceqiIgyZlNQH5aF8i0mPiQq-QhJh7crjcsoKW2QayIduVAkgwBQJavAMJacHPfEEWwvPgkGnQRuowPjKHJKvyHK-1uFHZowIGm-7LG3-o6iWN8hELpXPWLzgRgONxduPrr9kDbrfymZCjhbfg4-L_HeTrGz5YMkAIY4TpiO--BmBHrj5mRFU66VIyPSZJ_dvOmxwNElp4lsjZia9UoNI98qjT8gz6QP3a3xicoCha6qNlQ' }}
          style={s.galleryImage}
          accessibilityLabel="Traditional Kandyan dancer in costume"
        />
        <View style={s.galleryOverlayGradient} />
        <Text style={s.galleryTypeIcon}>🖼</Text>
      </View>
    </ScrollView>
  </View>
);



// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const CreatorDashboard: React.FC<{ onNavigate: (tab: NavTab) => void }> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<JobTab>('active');

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <TopAppBar />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <GreetingSection />
        <MetricsSection />

        {/* ── Job Management ───────────────────────────────────────────── */}
        <View style={s.section}>
          {/* Filter tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.tabsRow}
          >
            <TabPill
              label="Active Jobs"
              active={activeTab === 'active'}
              onPress={() => setActiveTab('active')}
            />
            <TabPill
              label="Upcoming Booking"
              active={activeTab === 'upcoming'}
              onPress={() => setActiveTab('upcoming')}
            />
            <TabPill
              label="Completed"
              active={activeTab === 'completed'}
              onPress={() => setActiveTab('completed')}
            />
          </ScrollView>

          {activeTab === 'active' ? (
            <ActiveJobCard />
          ) : (
            <View style={s.emptyState}>
              <Text style={s.emptyStateText}>No jobs to show.</Text>
            </View>
          )}
        </View>

        <FeedbackSection />
        <RecentWorkSection />
        <View style={{ height: 8 }} />
      </ScrollView>

      <BottomNavBar activeTab="home" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const GALLERY_SIZE = 128;

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },

  // ── App Bar ────────────────────────────────────────────────────────────────
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 56,
    backgroundColor: D.surfaceContainerLowest,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: D.surfaceVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  appBarIconBtn: {
    width: 44, height: 44, borderRadius: Radii.full,  // 44pt touch target
    alignItems: 'center', justifyContent: 'center',
  },
  appBarTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG,      // 18sp
    lineHeight: Typography.sizeLG * 1.4,
    color: '#0F5C5C',                 // teal (30% rule)
    letterSpacing: -0.3,
  },
  hamburger:     { gap: 4 },
  hamburgerLine: { width: 18, height: 2, borderRadius: 1, backgroundColor: '#0F5C5C' },
  bellWrapper: { alignItems: 'center' },
  bellTop:     { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#0F5C5C', marginBottom: 1 },
  bellBody:    { width: 14, height: 13, borderWidth: 1.5, borderColor: '#0F5C5C', borderRadius: 7, borderBottomWidth: 0 },
  bellClapper: { width: 5, height: 2, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, backgroundColor: '#0F5C5C' },

  // ── Scroll ─────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },

  // ── Greeting ───────────────────────────────────────────────────────────────
  greetingRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 2, borderColor: D.surfaceVariant,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
  },
  greetingText:     { flex: 1, justifyContent: 'center' },
  greetingHeadline: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD, lineHeight: 24, color: D.onSurface,
  },
  greetingSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    lineHeight: 22,
    color: D.onSurfaceVariant, marginTop: 2,
  },

  // ── Metrics ────────────────────────────────────────────────────────────────
  metricsGrid: { gap: Spacing.md },
  statsCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl, padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  ratingRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingValue:   { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG, color: '#E8792E', lineHeight: 28 },
  statsRight:    { alignItems: 'flex-end' },
  statsJobCount: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: '#0F5C5C', letterSpacing: 0.5 },
  statsContrib:  { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: D.onSurfaceVariant, marginTop: 2 },

  balanceCard: {
    backgroundColor: '#0F5C5C',
    borderRadius: Radii.xl, padding: Spacing.md, overflow: 'hidden',
    shadowColor: '#0F5C5C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  balanceGlow: {
    position: 'absolute', top: -40, right: -40, width: 128, height: 128,
    borderRadius: 64, backgroundColor: 'rgba(232,121,46,0.15)', opacity: 1,
  },
  balanceLabel: {
    fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: '#ffffff',
    letterSpacing: 1.2, opacity: 0.85, marginBottom: Spacing.xs,
  },
  balanceAmount: {
    fontFamily: Typography.fontDisplay, fontSize: 32, lineHeight: 40,
    letterSpacing: -0.5, color: '#ffffff', fontWeight: '800', marginBottom: Spacing.md,
  },
  balanceBtnRow:         { flexDirection: 'row', gap: Spacing.sm },
  balanceBtnOutline: {
    flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', borderRadius: Radii.lg,
    paddingVertical: 12, alignItems: 'center', justifyContent: 'center',
    minHeight: 44, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  balanceBtnOutlineText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ffffff' },
  balanceBtnFill: {
    flex: 1, backgroundColor: '#E8792E', borderRadius: Radii.lg,
    paddingVertical: 12, alignItems: 'center', justifyContent: 'center',
    minHeight: 44,
    shadowColor: '#E8792E', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  balanceBtnFillText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ffffff' },

  // ── Section ────────────────────────────────────────────────────────────────
  section:       { gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle:  {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeLG,
    color: D.onSurface,
    lineHeight: 28,
  },

  // ── Tabs ───────────────────────────────────────────────────────────────────
  tabsRow:           { flexDirection: 'row', gap: Spacing.sm, paddingBottom: 4 },
  tabPill:           { paddingHorizontal: 18, paddingVertical: 8, borderRadius: Radii.full },
  tabPillActive:     {
    backgroundColor: D.secondary,
    shadowColor: D.secondary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2,
  },
  tabPillInactive:   { backgroundColor: D.surfaceContainer, borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant },
  tabPillText:       { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurfaceVariant, letterSpacing: 0.3 },
  tabPillTextActive: { color: D.onSecondary },

  // ── Job Card ───────────────────────────────────────────────────────────────
  jobCard: {
    backgroundColor: D.surfaceContainerLowest, borderRadius: Radii.xl, padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 1, gap: Spacing.sm,
  },
  jobCardPressed: { shadowOpacity: 0.12, elevation: 3 },
  jobCardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm },
  jobCardLeft:    { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, flex: 1 },
  jobIconBox:     { width: 40, height: 40, borderRadius: Radii.lg, backgroundColor: D.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  jobTitle:       { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, lineHeight: 24, color: D.onSurface, marginBottom: 2 },
  jobClient:      { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: '#0F5C5C' },  // teal
  jobStatusBadge: { backgroundColor: D.surfaceContainerHigh, borderRadius: Radii.sm, paddingHorizontal: 7, paddingVertical: 3, marginTop: 2 },
  jobStatusText:  { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurfaceVariant, letterSpacing: 0.8 },
  jobDesc:        { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 22, color: D.onSurfaceVariant },
  jobMeta:        { flexDirection: 'row', gap: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: D.surfaceVariant, marginTop: 2 },
  jobMetaItem:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  jobMetaText:    { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurfaceVariant, letterSpacing: 0.2 },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyState:     { paddingVertical: Spacing.xl, alignItems: 'center' },
  emptyStateText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  // ── Feedback ───────────────────────────────────────────────────────────────
  feedbackRating: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.tertiaryContainer, lineHeight: 20 },
  feedbackCard: {
    backgroundColor: D.surfaceContainerLow, borderRadius: Radii.xl, padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant, overflow: 'hidden',
  },
  quoteDecor:  { position: 'absolute', top: -8, left: -4, fontSize: 80, color: D.surfaceVariant, opacity: 0.3, lineHeight: 80, fontFamily: Typography.fontDisplay },
  quoteBar:    { position: 'absolute', left: Spacing.md, top: Spacing.md, bottom: Spacing.md, width: 2, backgroundColor: D.secondaryFixedDim, borderRadius: 1 },
  quoteText:   { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 22, color: D.onSurfaceVariant, fontStyle: 'italic', paddingLeft: Spacing.md },
  quoteAuthor: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.secondary, textAlign: 'right', marginTop: Spacing.sm, letterSpacing: 0.3 },

  // ── Gallery ────────────────────────────────────────────────────────────────
  viewAllText:            { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.secondary, letterSpacing: 0.2 },
  galleryRow:             { flexDirection: 'row', gap: Spacing.md, paddingBottom: 4 },
  galleryItem: {
    width: GALLERY_SIZE, height: GALLERY_SIZE, borderRadius: Radii.xl, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  galleryImage:           { width: '100%', height: '100%' },
  galleryOverlayGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  galleryOverlayDark:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.18)' },
  galleryTypeIcon:        { position: 'absolute', bottom: 8, left: 8, fontSize: 18, color: '#fff' },
  playBtnWrapper:         { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.82)', alignItems: 'center', justifyContent: 'center' },

  // ── Press feedback ─────────────────────────────────────────────────────────
  pressed:      { opacity: 0.75 },
  pressedDark:  { backgroundColor: 'rgba(255,255,255,0.14)' },
  pressedLight: { opacity: 0.88 },
});

export default CreatorDashboard;

