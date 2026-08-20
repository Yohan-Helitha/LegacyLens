import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Typography, Spacing, Radii } from '../../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// Local design tokens (mapped from HTML Tailwind colour system — Monsoon Coast)
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  surface:                '#EDEFEE',
  surfaceContainerLowest: '#ffffff',
  surfaceVariant:         '#c8dcdc',

  primary:   '#0F5C5C',
  onPrimary: '#ffffff',

  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',
} as const;

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
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const CreatorVerificationUpdatePage: React.FC<{
  onBackToHome?: () => void;
}> = ({ onBackToHome }) => {
  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom'] as const}>
      <StatusBar style="dark" />

      <TopAppBar />

      <View style={s.content}>
        {/* ── Status hero ────────────────────────────────────────────────── */}
        <View style={s.heroBlock}>
          <View style={s.checkCircle}>
            <Text style={s.checkMark}>{'✓'}</Text>
          </View>
          <Text style={s.heroTitle}>Application Submitted</Text>
          <Text style={s.heroSubtitle}>
            Your creator application has been sent to the LegacyLens administrator for review.
          </Text>
        </View>

        {/* ── Verification Pending card ─────────────────────────────────── */}
        <View style={s.pendingCard}>
          <View style={s.pendingAccentBar} />
          <View style={s.pendingBody}>
            <Text style={s.pendingTitle}>Verification Pending</Text>
            <Text style={s.pendingText}>
              Your application is currently being reviewed. We will notify you when your
              application has been reviewed.
            </Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {/* ── Action button ──────────────────────────────────────────────── */}
        <Pressable
          onPress={onBackToHome}
          style={({ pressed }) => [s.homeBtn, pressed && s.homeBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
        >
          <Text style={s.homeBtnText}>Back to Home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default CreatorVerificationUpdatePage;

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

  // ── Content ────────────────────────────────────────────────────────────────
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },

  // ── Hero ───────────────────────────────────────────────────────────────────
  heroBlock: { alignItems: 'center', marginBottom: Spacing.lg },
  checkCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: D.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
  },
  checkMark: { fontSize: 44, lineHeight: 48, color: '#ffffff', fontWeight: '700' },
  heroTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,      // 24sp — standard h1 for mobile
    lineHeight: 30,
    color: D.onSurface,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,      // 14sp — secondary copy
    lineHeight: 20,
    color: D.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 280,
  },

  // ── Pending card ───────────────────────────────────────────────────────────
  pendingCard: {
    flexDirection: 'row',
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    overflow: 'hidden',
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 1,
  },
  pendingAccentBar: { width: 4, backgroundColor: D.primary, opacity: 0.7 },
  pendingBody: { flex: 1, padding: Spacing.md, gap: Spacing.xs },
  pendingTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,      // 16sp — button/label weight heading
    color: D.onSurface,
  },
  pendingText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,      // 14sp — body copy
    lineHeight: 20,
    color: D.onSurfaceVariant,
  },

  // ── Action button ──────────────────────────────────────────────────────────
  homeBtn: {
    backgroundColor: D.primary,       // teal (30% — primary action)
    borderRadius: 16,
    paddingVertical: 14,
    minHeight: 48,                    // touch target
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  homeBtnPressed: { opacity: 0.9 },
  homeBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,      // 16sp — button label
    color: '#ffffff',
    letterSpacing: 0.2,
  },

  // ── Press feedback ─────────────────────────────────────────────────────────
  pressed: { opacity: 0.75 },
});
