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
interface OnBoarding1Props {
  onNext?: () => void;
  onSkip?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pagination dots (step 1 of 3 active)
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
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export const OnBoarding1: React.FC<OnBoarding1Props> = ({ onNext, onSkip }) => {
  const { height } = useWindowDimensions();
  // Illustration scales with screen height: 38% of height, clamped 140–220px
  const illSize = Math.max(140, Math.min(220, height * 0.38));
  const illMarginBottom = height < 700 ? Spacing.lg : Spacing.xl * 1.5;

  const floatAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(30)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const btnScale   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance: fade + slide
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
    ]).start();

    // Continuous illustration float
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 1800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,   duration: 1800, useNativeDriver: true }),
      ]),
    ).start();
  }, [fadeAnim, floatAnim, slideAnim]);

  const pressIn  = () => Animated.timing(btnScale, { toValue: 0.97, duration: 80,  useNativeDriver: true }).start();
  const pressOut = () => Animated.timing(btnScale, { toValue: 1,    duration: 120, useNativeDriver: true }).start();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor={Colors.dominant} />

      {/* ── Ambient glow ─────────────────────────────────────────────────── */}
      <View style={styles.glowTL} pointerEvents="none" />
      <View style={styles.glowBR} pointerEvents="none" />

      {/* ── Skip ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          onPress={onSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          hitSlop={12}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {/* Illustration */}
        <Animated.View
          style={[
            styles.illustrationWrap,
            { width: illSize, height: illSize, marginBottom: illMarginBottom,
              transform: [{ translateY: floatAnim }] },
          ]}
        >
          {/* Glow halo */}
          <View style={[styles.halo, { width: illSize + 28, height: illSize + 28 }]} />

          {/* Main circle */}
          <View style={[styles.iconCircle, { width: illSize, height: illSize }]}>
            <Text style={[styles.mainIcon, { fontSize: illSize * 0.375 }]}>📖</Text>
          </View>

          {/* Accent badge — auto_awesome (top-right) */}
          <View style={[styles.badge, styles.badgeTR]}>
            <Text style={styles.badgeIcon}>✨</Text>
          </View>

          {/* Accent badge — mic (bottom-left) */}
          <View style={[styles.badge, styles.badgeBL, styles.badgeGreen]}>
            <Text style={styles.badgeIcon}>🎙️</Text>
          </View>
        </Animated.View>

        {/* Text */}
        <View style={styles.textBlock}>
          <Text style={styles.headline} accessibilityRole="header">
            Share your stories.
          </Text>
          <Text style={styles.subheadline}>
            Record your memories yourself, or ask a young creator to help you.
          </Text>
        </View>
      </Animated.View>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <PaginationDots active={0} />

        <Animated.View style={{ transform: [{ scale: btnScale }], width: '100%' }}>
          <Pressable
            onPress={onNext}
            onPressIn={pressIn}
            onPressOut={pressOut}
            accessibilityRole="button"
            accessibilityLabel="Next"
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Next</Text>
            <Text style={styles.btnArrow}>→</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const TEAL   = '#0F5C5C';  // primary
const ORANGE = '#E8792E';  // secondary / accent

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.dominant,
  },

  // ── Glows ──────────────────────────────────────────────────────────────────
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

  // ── Header ─────────────────────────────────────────────────────────────────
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

  // ── Content ────────────────────────────────────────────────────────────────
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },

  // ── Illustration — sizes injected inline via useWindowDimensions ────────────
  illustrationWrap: {
    // width/height/marginBottom set inline
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  halo: {
    position: 'absolute',
    // width/height set inline
    borderRadius: Radii.full,
    backgroundColor: 'rgba(15, 92, 92, 0.05)',
    transform: [{ scale: 1.5 }],
  },
  iconCircle: {
    // width/height set inline
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
    // fontSize set inline
    lineHeight: undefined,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  badge: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeTR: { top: 4, right: 4 },
  badgeBL: { bottom: -8, left: 16 },
  badgeGreen: { backgroundColor: TEAL },
  badgeIcon: {
    fontSize: 16,
    lineHeight: 20,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },

  // ── Text ───────────────────────────────────────────────────────────────────
  textBlock: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  headline: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size2XL,
    lineHeight: 40,
    color: Colors.text,
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

  // ── Footer ─────────────────────────────────────────────────────────────────
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    letterSpacing: 0.5,
    color: Colors.white,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  btnArrow: {
    fontSize: 18,
    color: Colors.white,
    lineHeight: 24,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});

export default OnBoarding1;
