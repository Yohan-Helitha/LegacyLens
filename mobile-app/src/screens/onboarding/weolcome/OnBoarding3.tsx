import React, { useRef, useEffect } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors, Typography, Spacing, Radii } from '../../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface OnBoarding3Props {
  /** Fired when user taps "Get Started" — navigate to home/main screen */
  onGetStarted?: () => void;
  /** Fired when user taps "Skip" */
  onSkip?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pagination dots (step 3 of 3 active)
// ─────────────────────────────────────────────────────────────────────────────
const PaginationDots: React.FC<{ active: number }> = ({ active }) => (
  <View style={dotStyles.row}>
    {[0, 1, 2].map((i) => (
      <View
        key={i}
        style={[
          dotStyles.dot,
          i === active ? dotStyles.dotActive : dotStyles.dotInactive,
        ]}
      />
    ))}
  </View>
);

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { height: 8, borderRadius: Radii.full },
  dotActive: { width: 28, backgroundColor: Colors.accent },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(107, 113, 120, 0.3)',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Region cards — matching the "organized by region" theme from board3.html
// ─────────────────────────────────────────────────────────────────────────────
const REGIONS = [
  { icon: '🏔️', name: 'Kandy' },
  { icon: '🌊', name: 'Jaffna' },
  { icon: '🌴', name: 'Galle' },
];

const RegionChips: React.FC = () => (
  <View style={chipStyles.row}>
    {REGIONS.map((r) => (
      <View key={r.name} style={chipStyles.chip}>
        <Text style={chipStyles.icon}>{r.icon}</Text>
        <Text style={chipStyles.label}>{r.name}</Text>
      </View>
    ))}
  </View>
);

const chipStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: Radii.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 207, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  icon: {
    fontSize: 16,
    lineHeight: 20,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  label: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    lineHeight: 20,
    color: Colors.text,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export const OnBoarding3: React.FC<OnBoarding3Props> = ({
  onGetStarted,
  onSkip,
}) => {
  const { height } = useWindowDimensions();
  const illSize = Math.max(140, Math.min(220, height * 0.38));
  const illMarginBottom = height < 700 ? Spacing.lg : Spacing.xl * 1.5;

  const floatAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(30)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const btnScale   = useRef(new Animated.Value(1)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
    ]).start();

    // Float
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 1900, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,   duration: 1900, useNativeDriver: true }),
      ]),
    ).start();

    // CTA button pulse — subtle attention on last screen
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, [fadeAnim, floatAnim, pulseAnim, slideAnim]);

  const pressIn  = () => {
    pulseAnim.stopAnimation();
    Animated.timing(btnScale, { toValue: 0.97, duration: 80,  useNativeDriver: true }).start();
  };
  const pressOut = () =>
    Animated.timing(btnScale, { toValue: 1, duration: 120, useNativeDriver: true }).start();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor={Colors.dominant} />

      {/* ── Ambient glows ────────────────────────────────────────────────── */}
      <View style={styles.glowTL} pointerEvents="none" />
      <View style={styles.glowBR} pointerEvents="none" />

      {/* ── Skip (hidden on last screen — kept for layout symmetry) ──────── */}
      <View style={styles.header}>
        <Pressable
          onPress={onSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          hitSlop={12}
          style={{ opacity: 0.4 }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {/* Illustration — map + location_on + auto_awesome (from board3.html) */}
        <Animated.View
          style={[
            styles.illustrationWrap,
            { width: illSize, height: illSize, marginBottom: illMarginBottom,
              transform: [{ translateY: floatAnim }] },
          ]}
        >
          <View style={[styles.halo, { width: illSize + 28, height: illSize + 28 }]} />

          <View style={[styles.iconCircle, { width: illSize, height: illSize }]}>
            <Text style={[styles.mainIcon, { fontSize: illSize * 0.375 }]}>🗺️</Text>
          </View>

          {/* location_on accent — bottom-right */}
          <View style={[styles.badge, styles.badgeBR]}>
            <Text style={styles.badgeIcon}>📍</Text>
          </View>

          {/* auto_awesome accent — top-left */}
          <View style={[styles.badge, styles.badgeTL, styles.badgeOrange]}>
            <Text style={styles.badgeIcon}>✨</Text>
          </View>
        </Animated.View>

        {/* Text */}
        <View style={styles.textBlock}>
          <Text style={styles.headline} accessibilityRole="header">
            Discover a living archive.
          </Text>
          <Text style={styles.subheadline}>
            Explore stories, songs, and traditions from across Sri Lanka, organized by region.
          </Text>
        </View>

        {/* Region chips */}
        <RegionChips />
      </Animated.View>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <PaginationDots active={2} />

        <Animated.View
          style={{
            transform: [{ scale: Animated.multiply(btnScale, pulseAnim) }],
            width: '100%',
          }}
        >
          <Pressable
            onPress={onGetStarted}
            onPressIn={pressIn}
            onPressOut={pressOut}
            accessibilityRole="button"
            accessibilityLabel="Get Started"
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const TEAL   = '#0F5C5C';
const ORANGE = '#E8792E';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.dominant,
  },

  glowTL: {
    position: 'absolute',
    width: 340,
    height: 340,
    top: -100,
    left: -100,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(15, 92, 92, 0.06)',
  },
  glowBR: {
    position: 'absolute',
    width: 280,
    height: 280,
    bottom: -80,
    right: -80,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(232, 121, 46, 0.05)',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  skipText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    lineHeight: 20,
    letterSpacing: 0.5,
    color: Colors.textMuted,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },

  illustrationWrap: {
    width: 192,
    height: 192,
    marginBottom: Spacing.xl * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  halo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(15, 92, 92, 0.05)',
    transform: [{ scale: 1.5 }],
  },
  iconCircle: {
    width: 192,
    height: 192,
    borderRadius: Radii.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: 'rgba(232, 226, 210, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 4,
  },
  mainIcon: {
    fontSize: 72,
    lineHeight: 88,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  badge: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeBR: { bottom: -8, right: 16 },
  badgeTL: { top: -8, left: 16 },
  badgeOrange: { backgroundColor: ORANGE },
  badgeIcon: {
    fontSize: 16,
    lineHeight: 20,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },

  textBlock: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  headline: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size2XL,
    lineHeight: 40,
    color: TEAL,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: Spacing.md,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  subheadline: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeLG,
    lineHeight: 28,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 300,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },

  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
    gap: 24,
  },
  primaryBtn: {
    width: '100%',
    minHeight: 56,
    backgroundColor: TEAL,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  },
  primaryBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    letterSpacing: 0.5,
    color: Colors.white,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});

export default OnBoarding3;
