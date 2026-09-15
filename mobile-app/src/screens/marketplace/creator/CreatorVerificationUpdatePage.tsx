import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Typography, Spacing, Radii } from '../../../theme';
import { creatorApplicationApi } from '../../../services/api/creatorApplicationApi';
import type { CreatorApplicationStatus } from '../../../types/creatorApplication';

// ─────────────────────────────────────────────────────────────────────────────
// Local design tokens (mapped from HTML Tailwind colour system — Monsoon Coast)
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  surface:                '#EDEFEE',
  surfaceContainerLowest: '#ffffff',
  surfaceVariant:         '#c8dcdc',

  primary:   '#0F5C5C',
  onPrimary: '#ffffff',

  // Rejected state — same semantic red used across the app's design specs.
  error:          '#BA1A1A',
  errorContainer: '#FFDAD6',

  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Per-status content — one source of truth for what changes between screens
// ─────────────────────────────────────────────────────────────────────────────
type ViewState = CreatorApplicationStatus | 'LOADING' | 'NOT_FOUND';

interface StatusContent {
  accentColor: string;
  icon: string;
  heroTitle: string;
  heroSubtitle: string;
  cardTitle: string;
  cardText: string;
}

const STATUS_CONTENT: Record<CreatorApplicationStatus, StatusContent> = {
  PENDING: {
    accentColor: D.primary,
    icon: '✓',
    heroTitle: 'Application Submitted',
    heroSubtitle:
      'Your creator application has been sent to the LegacyLens administrator for review.',
    cardTitle: 'Verification Pending',
    cardText:
      'Your application is currently being reviewed. We will notify you when your application has been reviewed.',
  },
  VERIFIED: {
    accentColor: D.primary,
    icon: '✓',
    heroTitle: "You're Verified!",
    heroSubtitle:
      'Your creator application has been approved — you now have full access to the Creator Dashboard.',
    cardTitle: 'Verification Complete',
    cardText:
      'Welcome to the LegacyLens creator community! Head to your dashboard to start taking on opportunities.',
  },
  REJECTED: {
    accentColor: D.error,
    icon: '✕',
    heroTitle: 'Application Not Approved',
    heroSubtitle:
      "Your creator application wasn't approved this time. You're welcome to update your details and resubmit.",
    cardTitle: 'Needs Attention',
    cardText:
      'Review your information, skills, and verification proof, then resubmit your application for another review.',
  },
};

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
  /** Rejected applicants can edit and resubmit — see CreatorApplicationServiceImpl. */
  onReapply?: () => void;
}> = ({ onBackToHome, onReapply }) => {
  const [state, setState] = useState<ViewState>('LOADING');

  const fetchStatus = useCallback(() => {
    setState('LOADING');
    creatorApplicationApi
      .getMe()
      .then((application) => setState(application.status))
      .catch(() => setState('NOT_FOUND'));
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (state === 'LOADING') {
    return (
      <SafeAreaView style={s.safeArea} edges={['top', 'bottom'] as const}>
        <StatusBar style="dark" />
        <TopAppBar />
        <View style={s.loadingContent}>
          <ActivityIndicator size="large" color={D.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (state === 'NOT_FOUND') {
    return (
      <SafeAreaView style={s.safeArea} edges={['top', 'bottom'] as const}>
        <StatusBar style="dark" />
        <TopAppBar />
        <View style={s.content}>
          <View style={s.centerGroup}>
            <View style={s.heroBlock}>
              <Text style={s.heroTitle}>No Application Found</Text>
              <Text style={s.heroSubtitle}>
                We couldn't find a creator application on file for your account.
              </Text>
            </View>
          </View>
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
  }

  const content = STATUS_CONTENT[state];

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom'] as const}>
      <StatusBar style="dark" />

      <TopAppBar />

      <View style={s.content}>
        <View style={s.centerGroup}>
          {/* ── Status hero ──────────────────────────────────────────────── */}
          <View style={s.heroBlock}>
            <View style={[s.statusCircle, { backgroundColor: content.accentColor }]}>
              <Text style={s.statusIcon}>{content.icon}</Text>
            </View>
            <Text style={s.heroTitle}>{content.heroTitle}</Text>
            <Text style={s.heroSubtitle}>{content.heroSubtitle}</Text>
          </View>

          {/* ── Status card ─────────────────────────────────────────────── */}
          <View style={s.statusCard}>
            <View style={[s.statusAccentBar, { backgroundColor: content.accentColor }]} />
            <View style={s.statusCardBody}>
              <Text style={s.statusCardTitle}>{content.cardTitle}</Text>
              <Text style={s.statusCardText}>{content.cardText}</Text>
            </View>
          </View>
        </View>

        {/* ── Actions ───────────────────────────────────────────────────── */}
        {state === 'REJECTED' && (
          <Pressable
            onPress={onReapply}
            style={({ pressed }) => [s.secondaryBtn, pressed && s.secondaryBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Edit and resubmit application"
          >
            <Text style={s.secondaryBtnText}>Edit &amp; Resubmit</Text>
          </Pressable>
        )}

        <Pressable
          onPress={onBackToHome}
          style={({ pressed }) => [s.homeBtn, pressed && s.homeBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel={state === 'VERIFIED' ? 'Go to Dashboard' : 'Back to Home'}
        >
          <Text style={s.homeBtnText}>
            {state === 'VERIFIED' ? 'Go to Dashboard' : 'Back to Home'}
          </Text>
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
  loadingContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Absorbs the space between the header and the action button(s) so the
  // hero + status card sit centered on the page instead of stuck at the top
  // with a large empty gap below (that gap used to be a bare flex:1 spacer).
  centerGroup: { flex: 1, justifyContent: 'center', gap: Spacing.lg },

  // ── Hero ───────────────────────────────────────────────────────────────────
  heroBlock: { alignItems: 'center' },
  statusCircle: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
  },
  statusIcon: { fontSize: 44, lineHeight: 48, color: '#ffffff', fontWeight: '700' },
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

  // ── Status card ────────────────────────────────────────────────────────────
  statusCard: {
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
  statusAccentBar: { width: 4, opacity: 0.7 },
  statusCardBody: { flex: 1, padding: Spacing.md, gap: Spacing.xs },
  statusCardTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,      // 16sp — button/label weight heading
    color: D.onSurface,
  },
  statusCardText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,      // 14sp — body copy
    lineHeight: 20,
    color: D.onSurfaceVariant,
  },

  // ── Actions ────────────────────────────────────────────────────────────────
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
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: D.error,
    borderRadius: 16,
    paddingVertical: 14,
    minHeight: 48,                    // touch target
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  secondaryBtnPressed: { backgroundColor: D.errorContainer },
  secondaryBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: D.error,
    letterSpacing: 0.2,
  },

  // ── Press feedback ─────────────────────────────────────────────────────────
  pressed: { opacity: 0.75 },
});
