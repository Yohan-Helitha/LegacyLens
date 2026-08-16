import React from 'react';
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

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens (HTML Tailwind colour system)
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  surface:                '#fbf9f4',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow:    '#f5f3ee',
  surfaceContainer:       '#f0eee9',
  surfaceContainerHigh:   '#eae8e3',
  surfaceVariant:         '#e4e2dd',
  outlineVariant:         '#debfbd',

  primary:              '#9f3032',
  onPrimary:            '#ffffff',
  primaryContainer:     '#c04848',
  onPrimaryContainer:   '#fff3f2',

  secondary:            '#336574',
  secondaryContainer:   '#b8eafc',
  onSecondaryContainer: '#3a6b7a',

  tertiary:          '#705400',
  tertiaryFixedDim:  '#f5bf22',

  onSurface:        '#1b1c19',
  onSurfaceVariant: '#574140',
  outline:          '#8b716f',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type NavIconName = 'home' | 'market' | 'inbox' | 'person';

// ─────────────────────────────────────────────────────────────────────────────
// Inline icon helpers
// ─────────────────────────────────────────────────────────────────────────────
const NavIcon: React.FC<{ name: NavIconName; active: boolean }> = ({ name, active }) => {
  const color = active ? D.onPrimaryContainer : D.onSurfaceVariant;
  const icons: Record<NavIconName, string> = {
    home: '🏠', market: '🏪', inbox: '💬', person: '👤',
  };
  return <Text style={{ fontSize: 20, color, lineHeight: 24 }}>{icons[name]}</Text>;
};

// ─────────────────────────────────────────────────────────────────────────────
// TopAppBar  (back arrow + title + bell)
// ─────────────────────────────────────────────────────────────────────────────
const TopAppBar: React.FC = () => (
  <View style={s.appBar}>
    <Pressable
      style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}
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
// InfoTile — one bento cell
// ─────────────────────────────────────────────────────────────────────────────
const InfoTile: React.FC<{
  icon: string;
  label: string;
  value: string;
  accentBg: string;
  accentText: string;
  valueColor?: string;
  flex?: number;
}> = ({ icon, label, value, accentBg, accentText, valueColor, flex = 1 }) => (
  <View style={[s.infoTile, { flex }]}>
    <View style={s.infoTileHeader}>
      <View style={[s.infoIconBox, { backgroundColor: accentBg }]}>
        <Text style={[s.infoIconText, { color: accentText }]}>{icon}</Text>
      </View>
      <Text style={s.infoLabel}>{label}</Text>
    </View>
    <Text style={[s.infoValue, valueColor ? { color: valueColor } : null]}>
      {value}
    </Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// TaskItem — checklist row
// ─────────────────────────────────────────────────────────────────────────────
const TaskItem: React.FC<{ text: string }> = ({ text }) => (
  <View style={s.taskRow}>
    <View style={s.taskCheck}>
      <Text style={s.taskCheckMark}>{'✓'}</Text>
    </View>
    <Text style={s.taskText}>{text}</Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// BottomNavBar
// ─────────────────────────────────────────────────────────────────────────────
type NavTab = { label: string; icon: NavIconName; active: boolean };

const BottomNavBar: React.FC = () => {
  const tabs: NavTab[] = [
    { label: 'Home',    icon: 'home',   active: false },
    { label: 'Market',  icon: 'market', active: true  },
    { label: 'Inbox',   icon: 'inbox',  active: false },
    { label: 'Profile', icon: 'person', active: false },
  ];

  return (
    <View style={s.navBar}>
      {tabs.map(tab => (
        <Pressable
          key={tab.label}
          style={({ pressed }) => [
            s.navItem,
            tab.active && s.navItemActive,
            pressed && s.pressed,
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab.active }}
          accessibilityLabel={tab.label}
        >
          <NavIcon name={tab.icon} active={tab.active} />
          <Text style={[s.navLabel, tab.active && s.navLabelActive]}>
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const OpportunityDetailPage: React.FC = () => (
  <SafeAreaView style={s.safeArea} edges={['top'] as const}>
    <StatusBar style="dark" />

    <TopAppBar />

    {/* Scrollable content */}
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Page heading ──────────────────────────────────────────────────── */}
      <Text style={s.pageHeading}>Opportunity Details</Text>

      {/* ── Hero image ────────────────────────────────────────────────────── */}
      <View style={s.heroWrapper}>
        <Image
          source={{
            uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLMzgOt3M-dxeABJClXG1jDfKO-ip_kzzvv3oPGkERN7Nebumxn0je6tmFKrs0UtTn5aAKDd7PitlmYe1TfoEWlhpwXlqcAq63v5jFaTislTjoAurJJTzjl20cJmQOnn7cYgkLT5L9tabWPkT6OnnH4GHtr986BfgxV6IHSB_Z7wwPmrGXU2DLLvBOvQhe9ZOJCbKMgZ6i45_jYoUNCpsRHrAVOcKmjzmR6BEnlfUo6bOyE5wqQSdixw',
          }}
          style={s.heroImage}
          accessibilityLabel="Traditional stilt fishermen at golden hour, Negombo"
          resizeMode="cover"
        />
      </View>

      {/* ── Knowledge Holder card ─────────────────────────────────────────── */}
      <Pressable
        style={({ pressed }) => [s.holderCard, pressed && s.cardPressed]}
        accessibilityRole="button"
        accessibilityLabel="View Mrs. Kamala Wijesinghe's profile"
      >
        <View style={s.holderLeft}>
          <Image
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDY_5xLVHss2xIK0tURyAhPnGlFWUDP3XTq1WejeqSEMr8fsWQrsZ2EYIpiUkEyydmgKK0JCTRhqt2VCmoYtOuFSkXQ-QwDbrmjr1rY6gYdLVQKlP_n1KfxGyjle-S-SnACHim7CPo6tjRhFfr0teQneHXk_tWk1LM5lWORtVdaMgVNbphNBj5r-03l90MYqmU0WKcFvMMoC0MOfznhkzXUyIbwMDUs2NbypBfmOZctG362yqm2E260KQ',
            }}
            style={s.holderAvatar}
            accessibilityLabel="Mrs. Kamala Wijesinghe portrait"
          />
          <View style={s.holderInfo}>
            <Text style={s.holderName}>Mrs. Kamala Wijesinghe</Text>
            <View style={s.holderBadgeRow}>
              <Text style={s.verifiedStar}>{'✦'}</Text>
              <Text style={s.holderBadgeText}>Verified Knowledge holder</Text>
            </View>
          </View>
        </View>
        <Text style={s.chevron}>{'›'}</Text>
      </Pressable>

      {/* ── Info Grid row 1: Location / Date / Duration ───────────────────── */}
      <View style={s.gridRow}>
        <InfoTile
          icon={'📍'}
          label="LOCATION"
          value="Matara"
          accentBg={D.secondaryContainer}
          accentText={D.onSecondaryContainer}
        />
        <InfoTile
          icon={'📅'}
          label="DATE"
          value="Aug 25"
          accentBg={D.secondaryContainer}
          accentText={D.onSecondaryContainer}
        />
        <InfoTile
          icon={'⏱'}
          label="DURATION"
          value="3 - 4 h"
          accentBg={D.secondaryContainer}
          accentText={D.onSecondaryContainer}
        />
      </View>

      {/* ── Info Grid row 2: Offered / Time ──────────────────────────────── */}
      <View style={[s.gridRow, { marginTop: Spacing.sm }]}>
        <InfoTile
          icon={'💳'}
          label="OFFERED"
          value="LKR 3,500"
          accentBg={D.primaryContainer}
          accentText={D.onPrimaryContainer}
          valueColor={D.primary}
        />
        <InfoTile
          icon={'🕙'}
          label="TIME"
          value={'10.00 AM –\n1.00 PM'}
          accentBg={D.secondaryContainer}
          accentText={D.onSecondaryContainer}
        />
      </View>

      {/* ── Preservation Goal quote card ──────────────────────────────────── */}
      <View style={s.quoteCard}>
        {/* Decorative large quote mark */}
        <Text style={s.quoteLargeDecor}>{'\u201C'}</Text>
        {/* Left accent bar */}
        <View style={s.quoteAccentBar} />

        <Text style={s.quoteCardTitle}>What they want to preserve?</Text>
        <Text style={s.quoteCardText}>
          {'\u201CI would like to preserve how my family prepare this traditional recipe. I want someone to record this preparation including all the instruction and create a video that can be shared with younger generation.\u201D'}
        </Text>
      </View>

      {/* ── Tasks: What you'll do ─────────────────────────────────────────── */}
      <View style={s.tasksSection}>
        <Text style={s.tasksSectionTitle}>{'What you\'ll do'}</Text>
        <TaskItem text="Visit the knowledge holder in Matara." />
        <TaskItem text="Record the preparation process comprehensively." />
        <TaskItem text="Capture high-quality photos and video clip." />
        <TaskItem text="Document step-by-step instruction clearly." />
        <TaskItem text="Edit and submit the final video" />
      </View>

      {/* Bottom spacing — ensures content scrolls above Apply button */}
      <View style={{ height: 100 }} />
    </ScrollView>

    {/* ── Fixed Apply button (above nav bar) ───────────────────────────────── */}
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

    <BottomNavBar />
  </SafeAreaView>
);

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
    paddingBottom: Spacing.lg,
  },

  // ── Page heading ───────────────────────────────────────────────────────────
  pageHeading: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXL,
    lineHeight: 32,
    color: D.onSurface,
    marginBottom: Spacing.lg,
    letterSpacing: -0.2,
  },

  // ── Hero image ─────────────────────────────────────────────────────────────
  heroWrapper: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
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
  holderName:      { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.onSurface, lineHeight: 22 },
  holderBadgeRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  verifiedStar:    { fontSize: 12, color: D.tertiaryFixedDim },
  holderBadgeText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },
  chevron:         { fontSize: 22, color: D.onSurfaceVariant, lineHeight: 28 },
  cardPressed:     { opacity: 0.9 },

  // ── Info Grid ──────────────────────────────────────────────────────────────
  gridRow:       { flexDirection: 'row', gap: Spacing.sm, marginBottom: 0 },
  infoTile: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 1,
    justifyContent: 'center',
  },
  infoTileHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  infoIconBox: {
    width: 32, height: 32, borderRadius: Radii.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  infoIconText:  { fontSize: 16, lineHeight: 20 },
  infoLabel: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 10,
    color: D.onSurfaceVariant,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: D.onSurface,
    marginLeft: 40, // aligns with text beside icon
    lineHeight: 20,
  },

  // ── Preservation Quote card ────────────────────────────────────────────────
  quoteCard: {
    backgroundColor: D.surfaceContainerLow,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
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
  quoteAccentBar: {
    position: 'absolute',
    left: Spacing.lg + 4, // inside left border padding
    top: Spacing.lg,
    bottom: Spacing.lg,
    width: 2,
    backgroundColor: D.outlineVariant,
    borderRadius: 1,
  },
  quoteCardTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: D.onSurface,
    marginBottom: Spacing.sm,
    lineHeight: 24,
  },
  quoteCardText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    lineHeight: 26,
    color: D.onSurfaceVariant,
    fontStyle: 'italic',
    paddingLeft: Spacing.sm,
  },

  // ── Tasks ──────────────────────────────────────────────────────────────────
  tasksSection:      { gap: Spacing.sm },
  tasksSectionTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: D.onSurface,
    lineHeight: 24,
    marginBottom: Spacing.xs,
  },
  taskRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  taskCheck: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: D.secondaryContainer,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 2,
  },
  taskCheckMark: { fontSize: 11, color: D.onSecondaryContainer, lineHeight: 14, fontWeight: '700' },
  taskText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: D.onSurface,
    flex: 1,
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
    backgroundColor: D.primary,
    borderRadius: Radii.xl,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  applyBtnPressed: { opacity: 0.88, elevation: 2 },
  applyBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: D.onPrimary,
    letterSpacing: 0.2,
  },
  applyArrow: { fontSize: 18, color: D.onPrimary, lineHeight: 22 },

  // ── Bottom Nav ─────────────────────────────────────────────────────────────
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingHorizontal: Spacing.sm,
    backgroundColor: D.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: D.surfaceVariant,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 8,
  },
  navItem:        { alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radii.xl, gap: 2 },
  navItemActive:  { backgroundColor: D.primaryContainer },
  navLabel:       { fontFamily: Typography.fontBodyMed, fontSize: 10, color: D.onSurfaceVariant, letterSpacing: 0.2 },
  navLabelActive: { color: D.onPrimaryContainer },

  // ── Press feedback ─────────────────────────────────────────────────────────
  pressed: { opacity: 0.72 },
});
