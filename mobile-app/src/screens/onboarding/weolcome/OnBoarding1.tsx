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
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Sparkles, Mic } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radii } from '../../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface OnBoarding1Props {
  onNext?: () => void;
  onSkip?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom SVG Storybook Vector Illustration
// ─────────────────────────────────────────────────────────────────────────────
const StoryBookIllustration: React.FC<{ size: number }> = ({ size }) => {
  const svgSize = size * 0.58;
  return (
    <Svg width={svgSize} height={svgSize} viewBox="0 0 100 100" fill="none">
      <Defs>
        <LinearGradient id="bookCover" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#0F5C5C" />
          <Stop offset="100%" stopColor="#0A3D3D" />
        </LinearGradient>
        <LinearGradient id="pageGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#F5F7F6" />
        </LinearGradient>
      </Defs>

      {/* Book Cover */}
      <Path
        d="M10 24 C28 19, 42 20, 50 24 C58 20, 72 19, 90 24 L90 81 C72 76, 58 77, 50 81 C42 77, 28 76, 10 81 Z"
        fill="url(#bookCover)"
        stroke="#0A3D3D"
        strokeWidth="2"
      />

      {/* Left Page */}
      <Path
        d="M14 25 C26 21, 38 21.5, 48 25 L48 77 C38 73.5, 26 73, 14 77 Z"
        fill="url(#pageGrad)"
        stroke="#D9E0DE"
        strokeWidth="1.2"
      />

      {/* Right Page */}
      <Path
        d="M52 25 C62 21.5, 74 21, 86 25 L86 77 C74 73, 62 73.5, 52 77 Z"
        fill="url(#pageGrad)"
        stroke="#D9E0DE"
        strokeWidth="1.2"
      />

      {/* Spine line */}
      <Path d="M50 23 L50 82" stroke="#0A3D3D" strokeWidth="2.5" strokeLinecap="round" />

      {/* Ribbon Bookmark in Accent Orange */}
      <Path
        d="M50 23 L50 63 L54 59 L58 63 L58 24"
        fill={Colors.accent}
        opacity={0.95}
      />

      {/* Story lines on left page */}
      <Path d="M20 35 H42" stroke="#0F5C5C" strokeWidth="2.2" strokeLinecap="round" opacity={0.65} />
      <Path d="M20 44 H42" stroke="#0F5C5C" strokeWidth="2" strokeLinecap="round" opacity={0.4} />
      <Path d="M20 53 H38" stroke="#0F5C5C" strokeWidth="2" strokeLinecap="round" opacity={0.4} />
      <Path d="M20 62 H32" stroke="#0F5C5C" strokeWidth="2" strokeLinecap="round" opacity={0.3} />

      {/* Story lines on right page */}
      <Path d="M58 35 H80" stroke="#0F5C5C" strokeWidth="2.2" strokeLinecap="round" opacity={0.65} />
      <Path d="M58 44 H80" stroke="#0F5C5C" strokeWidth="2" strokeLinecap="round" opacity={0.4} />
      <Path d="M58 53 H74" stroke="#0F5C5C" strokeWidth="2" strokeLinecap="round" opacity={0.4} />
      <Path d="M58 62 H68" stroke="#0F5C5C" strokeWidth="2" strokeLinecap="round" opacity={0.3} />
    </Svg>
  );
};

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
            {
              width: illSize,
              height: illSize,
              marginBottom: illMarginBottom,
              transform: [{ translateY: floatAnim }],
            },
          ]}
        >
          {/* Multi-layered soft glow halos */}
          <View style={[styles.haloOuter, { width: illSize + 48, height: illSize + 48 }]} />
          <View style={[styles.halo, { width: illSize + 24, height: illSize + 24 }]} />

          {/* Main circle */}
          <View style={[styles.iconCircle, { width: illSize, height: illSize }]}>
            <StoryBookIllustration size={illSize} />
          </View>

          {/* Accent badge — Sparkles (top-right) */}
          <View style={[styles.badge, styles.badgeTR]}>
            <Sparkles size={18} color={Colors.white} strokeWidth={2.2} />
          </View>

          {/* Accent badge — Microphone (bottom-left) */}
          <View style={[styles.badge, styles.badgeBL, styles.badgeTeal]}>
            <Mic size={19} color={Colors.white} strokeWidth={2.2} />
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

  // ── Illustration ───────────────────────────────────────────────────────────
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  haloOuter: {
    position: 'absolute',
    borderRadius: Radii.full,
    backgroundColor: 'rgba(15, 92, 92, 0.03)',
  },
  halo: {
    position: 'absolute',
    borderRadius: Radii.full,
    backgroundColor: 'rgba(15, 92, 92, 0.06)',
  },
  iconCircle: {
    borderRadius: Radii.full,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: 'rgba(232, 226, 210, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 5,
  },
  badge: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: Radii.full,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 4,
  },
  badgeTR: { top: 2, right: 2 },
  badgeBL: { bottom: -6, left: 12 },
  badgeTeal: { backgroundColor: Colors.secondary },

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
    backgroundColor: Colors.secondary,
    borderRadius: Radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.secondary,
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
