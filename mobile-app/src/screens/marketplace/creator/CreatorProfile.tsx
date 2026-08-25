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
import Svg, { Path } from 'react-native-svg';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';
import { profileApi } from '../../../services/api/profileApi';
import { creatorDashboardApi } from '../../../services/api/creatorDashboardApi';
import type { CreatorDashboardSummaryResponse } from '../../../types/creatorDashboard';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — same "Monsoon Coast" system used across every creator screen
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  surface:                '#EDEFEE',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow:    '#f0f5f5',
  surfaceContainer:       '#e4efef',
  surfaceVariant:         '#c8dcdc',

  primary:              '#0F5C5C',
  onPrimary:            '#ffffff',

  secondary:            '#E8792E',
  onSecondary:          '#ffffff',
  secondaryContainer:   '#fff0e6',
  onSecondaryContainer: '#9e4a0d',

  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',

  gold: '#E8792E',
} as const;

// Same avatar already used for this creator across the app (CreatorDashboard's
// greeting header, and the bottom-nav Profile tab) — reused here per instruction
// so the profile picture is consistent everywhere, not a generic placeholder.
const FALLBACK_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBdmWxeiutm8VuCuwb8B-bcbY4uwLEOEIZpHad16sSCOnOCn176-8moOj3W6uDPAciix85yHVNmpAd1RTzDZNIib4AVMq68gwoQfyYec-CiNygpv3Rti52MfEWixskGSi9K2HzQJc1XhIg649C9xWHdmBqgXNA5LsR-CP4PfF7fUKsBLElU0twICuF7-ZcI9Vlnj9GgnzoL4Bqj9ilpxA4BZs3oFt_0h7PcPdk4HDm4JKWKr6S3bofO2g';

const FALLBACK_NAME = 'Arani Inothma';

const FALLBACK_SUMMARY: CreatorDashboardSummaryResponse = {
  rating: 4.8,
  completedJobsCount: 24,
  contributionsCount: 24,
  collectedToday: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Static profile content — not backed by a database field yet (bio, skills,
// languages, cultural interests, experience). Kept here as the frontend-only
// scope explicitly asked for; wiring these to real editable fields is a
// separate backend task for later.
// ─────────────────────────────────────────────────────────────────────────────
const ABOUT_ME =
  'I help knowledge holders document local stories. Traditional practices and cultural knowledge through photography, video and clear digital documentation.';

const SKILLS = ['Photography', 'Video documentation', 'Content writing', 'Basic video editing'];

const LANGUAGES = ['Sinhala', 'English'];

const CULTURAL_INTERESTS = ['Traditional Dance', 'Local stories', 'Traditional Food', 'Cultural festival'];

const EXPERIENCE_YEARS = 2;
const EXPERIENCE_BULLETS = [
  'Cultural event photography',
  'Local-language transcription',
  'Short-term heritage video production',
];

const APPROVED_COUNT = 18;
const ACTIVE_COUNT = 6;

type PreviousContribution = { id: string; title: string; approved: boolean };

const PREVIOUS_CONTRIBUTIONS: PreviousContribution[] = [
  { id: '1', title: 'Traditional recipe documentation', approved: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// Small inline icons
// ─────────────────────────────────────────────────────────────────────────────
const StarIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = D.gold }) => (
  <Text style={{ fontSize: size, color, lineHeight: size + 2 }}>★</Text>
);

const CheckBadge: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <View style={[s.checkBadge, { width: size, height: size, borderRadius: size / 2 }]}>
    <Text style={{ fontSize: size * 0.7, color: '#ffffff', fontWeight: '700' }}>{'✓'}</Text>
  </View>
);

const PencilIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// TopAppBar — same layout/icons as CreatorDashboard's
// ─────────────────────────────────────────────────────────────────────────────
const TopAppBar: React.FC = () => (
  <View style={s.appBar}>
    <Pressable style={({ pressed }) => [s.appBarIconBtn, pressed && s.pressed]} accessibilityRole="button" accessibilityLabel="Open menu">
      <View style={s.hamburger}>
        <View style={s.hamburgerLine} />
        <View style={s.hamburgerLine} />
        <View style={s.hamburgerLine} />
      </View>
    </Pressable>

    <Text style={s.appBarTitle}>Legacy Lens</Text>

    <Pressable style={({ pressed }) => [s.appBarIconBtn, pressed && s.pressed]} accessibilityRole="button" accessibilityLabel="Notifications">
      <View style={s.bellWrapper}>
        <View style={s.bellTop} />
        <View style={s.bellBody} />
        <View style={s.bellClapper} />
      </View>
    </Pressable>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Reusable section card
// ─────────────────────────────────────────────────────────────────────────────
const SectionCard: React.FC<{
  title: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, rightSlot, children }) => (
  <View style={s.card}>
    <View style={s.cardHeaderRow}>
      <Text style={s.cardTitle}>{title}</Text>
      {rightSlot}
    </View>
    {children}
  </View>
);

const Chip: React.FC<{ label: string; wide?: boolean }> = ({ label, wide }) => (
  <View style={[s.chip, wide && s.chipWide]}>
    <Text style={s.chipText} numberOfLines={1}>{label}</Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const CreatorProfile: React.FC<{
  onNavigate: (tab: NavTab) => void;
}> = ({ onNavigate }) => {
  const [name, setName] = useState(FALLBACK_NAME);
  const [avatarUri, setAvatarUri] = useState(FALLBACK_AVATAR);
  const [summary, setSummary] = useState<CreatorDashboardSummaryResponse>(FALLBACK_SUMMARY);

  useEffect(() => {
    profileApi
      .getMe()
      .then((me) => {
        if (me.fullName) setName(me.fullName);
        if (me.profilePhotoUrl) setAvatarUri(me.profilePhotoUrl);
      })
      .catch(() => {});

    creatorDashboardApi.getSummary().then(setSummary).catch(() => {});
  }, []);

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <TopAppBar />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page heading */}
        <View style={s.pageHeaderRow}>
          <Text style={s.pageHeading}>My Profile</Text>
          <Pressable
            style={({ pressed }) => [s.editBtn, pressed && s.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <PencilIcon />
          </Pressable>
        </View>

        {/* Identity block */}
        <View style={s.identityBlock}>
          <Image source={{ uri: avatarUri }} style={s.avatar} accessibilityLabel={`${name}'s profile photo`} />
          <Text style={s.name}>{name}</Text>
          <View style={s.identityMetaRow}>
            <StarIcon />
            <Text style={s.ratingText}>{summary.rating != null ? summary.rating.toFixed(1) : '—'}</Text>
            <Text style={s.metaDot}>{'|'}</Text>
            <CheckBadge />
            <Text style={s.contribText}>{summary.contributionsCount} contributions</Text>
          </View>
        </View>

        {/* About me */}
        <SectionCard title="About me">
          <Text style={s.aboutText}>{`"${ABOUT_ME}"`}</Text>
        </SectionCard>

        {/* My Skills */}
        <SectionCard title="My Skills">
          <View style={s.chipsRow}>
            {SKILLS.map((skill) => (
              <Chip key={skill} label={skill} wide />
            ))}
          </View>
        </SectionCard>

        {/* Language */}
        <SectionCard title="Language">
          <View style={{ gap: 4 }}>
            {LANGUAGES.map((lang) => (
              <Text key={lang} style={s.languageText}>{lang}</Text>
            ))}
          </View>
        </SectionCard>

        {/* Cultural Interests */}
        <SectionCard title="Cultural Interests">
          <View style={s.chipsRow}>
            {CULTURAL_INTERESTS.map((interest) => (
              <Chip key={interest} label={interest} wide />
            ))}
          </View>
        </SectionCard>

        {/* Experience */}
        <SectionCard
          title="Experience"
          rightSlot={<Text style={s.experienceYears}>{EXPERIENCE_YEARS} Years</Text>}
        >
          <View style={{ gap: 6 }}>
            {EXPERIENCE_BULLETS.map((bullet) => (
              <View key={bullet} style={s.bulletRow}>
                <View style={s.bulletDot} />
                <Text style={s.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
        </SectionCard>

        {/* Contribution Summary */}
        <View style={s.section}>
          <Text style={s.sectionTitleStandalone}>Contribution Summary</Text>
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statValue}>{summary.completedJobsCount}</Text>
              <Text style={s.statLabel}>Completed</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statValue}>{APPROVED_COUNT}</Text>
              <Text style={s.statLabel}>Approved</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statValue}>{ACTIVE_COUNT}</Text>
              <Text style={s.statLabel}>Active</Text>
            </View>
          </View>
        </View>

        {/* Previous Contribution */}
        <View style={s.section}>
          <Text style={s.sectionTitleStandalone}>Previous Contribution</Text>
          <View style={{ gap: Spacing.sm }}>
            {PREVIOUS_CONTRIBUTIONS.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [s.contribCard, pressed && s.cardPressed]}
                accessibilityRole="button"
                accessibilityLabel={item.title}
              >
                {item.approved && (
                  <View style={s.approvedBadgeRow}>
                    <CheckBadge size={13} />
                    <Text style={s.approvedBadgeText}>Approved</Text>
                  </View>
                )}
                <Text style={s.contribTitle}>{item.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ height: 8 }} />
      </ScrollView>

      <BottomNavBar activeTab="profile" onNavigate={onNavigate} profileAvatarUri={avatarUri} />
    </SafeAreaView>
  );
};

export default CreatorProfile;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },

  // ── App Bar ──────────────────────────────────────────────────────────────
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
  appBarIconBtn: { width: 44, height: 44, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
  appBarTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG,
    lineHeight: Typography.sizeLG * 1.4,
    color: D.primary,
    letterSpacing: -0.3,
  },
  hamburger:     { gap: 4 },
  hamburgerLine: { width: 18, height: 2, borderRadius: 1, backgroundColor: D.primary },
  bellWrapper: { alignItems: 'center' },
  bellTop:     { width: 3, height: 3, borderRadius: 1.5, backgroundColor: D.primary, marginBottom: 1 },
  bellBody:    { width: 14, height: 13, borderWidth: 1.5, borderColor: D.primary, borderRadius: 7, borderBottomWidth: 0 },
  bellClapper: { width: 5, height: 2, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, backgroundColor: D.primary },

  // ── Scroll ───────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },

  // ── Page heading ─────────────────────────────────────────────────────────
  pageHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageHeading: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXL,
    color: D.primary,
    letterSpacing: -0.2,
  },
  editBtn: {
    width: 40, height: 40, borderRadius: Radii.full,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: D.secondaryContainer,
  },

  // ── Identity block ───────────────────────────────────────────────────────
  identityBlock: { alignItems: 'center', paddingVertical: Spacing.sm, gap: 6 },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, borderColor: D.surfaceContainerLowest,
    backgroundColor: D.surfaceContainer,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
  },
  name: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeLG,
    color: D.onSurface,
    marginTop: 4,
  },
  identityMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onSurface },
  metaDot: { fontSize: Typography.sizeSM, color: D.surfaceVariant },
  contribText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },
  checkBadge: { backgroundColor: D.primary, alignItems: 'center', justifyContent: 'center' },

  // ── Section cards ────────────────────────────────────────────────────────
  card: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.primary },
  aboutText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    lineHeight: 22,
    color: D.onSurfaceVariant,
    fontStyle: 'italic',
  },
  languageText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.secondary },
  experienceYears: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: D.secondary,
  },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: D.secondary, marginTop: 8 },
  bulletText: { flex: 1, fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 21, color: D.onSurfaceVariant },

  // ── Chips ────────────────────────────────────────────────────────────────
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    backgroundColor: D.surfaceContainerLow,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    borderRadius: Radii.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipWide: { flexBasis: '46%', flexGrow: 1, alignItems: 'center' },
  chipText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurface },

  // ── Standalone section title (no card wrapper) ──────────────────────────
  section: { gap: Spacing.sm },
  sectionTitleStandalone: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: D.onSurface,
  },

  // ── Contribution stats ───────────────────────────────────────────────────
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statBox: {
    flex: 1,
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG, color: D.secondary },
  statLabel: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },

  // ── Previous contribution ────────────────────────────────────────────────
  contribCard: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    borderLeftWidth: 3,
    borderLeftColor: D.primary,
    padding: Spacing.md,
    gap: 6,
  },
  cardPressed: { opacity: 0.85 },
  approvedBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  approvedBadgeText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.primary, letterSpacing: 0.3 },
  contribTitle: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.onSurface },

  // ── Press feedback ───────────────────────────────────────────────────────
  pressed: { opacity: 0.75 },
});
