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
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { BookOpen, Sparkles, TreePine, Languages, ScrollText } from 'lucide-react-native';
import { HeroIllustrationFrame, PaginationDots } from '../../../components/common';
import { Colors, Typography, Spacing, Radii } from '../../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface OnBoarding2Props {
  onNext?: () => void;
  onSkip?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom SVG Heritage Roots Vector Illustration
// ─────────────────────────────────────────────────────────────────────────────
const RootsIllustration: React.FC<{ size: number }> = ({ size }) => {
  const svgSize = size * 0.58;
  return (
    <Svg width={svgSize} height={svgSize} viewBox="0 0 100 100" fill="none">
      <Defs>
        <LinearGradient id="treeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#0F5C5C" />
          <Stop offset="100%" stopColor="#0A3D3D" />
        </LinearGradient>
        <LinearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#E8792E" />
          <Stop offset="100%" stopColor="#C9611D" />
        </LinearGradient>
      </Defs>

      {/* Ground / Open book foundation base */}
      <Path
        d="M20 78 C35 73, 45 74, 50 78 C55 74, 65 73, 80 78"
        stroke="#0F5C5C"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M26 84 C38 80, 46 80.5, 50 84 C54 80.5, 62 80, 74 84"
        stroke="#E8792E"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.8}
      />

      {/* Main Trunk */}
      <Path
        d="M50 78 V46 M46 62 C42 56, 32 52, 26 50 M54 58 C60 52, 70 48, 76 46 M48 48 C44 40, 36 34, 30 32 M52 46 C58 38, 66 34, 72 32 M50 46 V26"
        stroke="url(#treeGrad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Leaves & Blooms in Accent Orange & Teal */}
      <Circle cx="50" cy="20" r="6" fill="#0F5C5C" />
      <Circle cx="30" cy="28" r="5.5" fill="#E8792E" />
      <Circle cx="70" cy="28" r="5.5" fill="#0F5C5C" />
      <Circle cx="22" cy="46" r="5" fill="#0F5C5C" />
      <Circle cx="78" cy="42" r="5" fill="#E8792E" />
      <Circle cx="40" cy="24" r="4.5" fill="#E8792E" opacity={0.9} />
      <Circle cx="60" cy="24" r="4.5" fill="#E8792E" opacity={0.9} />
      <Circle cx="34" cy="38" r="4" fill="#0F5C5C" opacity={0.8} />
      <Circle cx="66" cy="38" r="4" fill="#0F5C5C" opacity={0.8} />
    </Svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Feature chips with Lucide Vector Icons
// ─────────────────────────────────────────────────────────────────────────────
const FeatureChips: React.FC = () => (
  <View style={chipStyles.row}>
    <View style={chipStyles.chip}>
      <TreePine size={16} color={Colors.secondary} strokeWidth={2} />
      <Text style={chipStyles.label}>Family roots</Text>
    </View>
    <View style={chipStyles.chip}>
      <Languages size={16} color={Colors.secondary} strokeWidth={2} />
      <Text style={chipStyles.label}>Dialects</Text>
    </View>
    <View style={chipStyles.chip}>
      <ScrollText size={16} color={Colors.secondary} strokeWidth={2} />
      <Text style={chipStyles.label}>Traditions</Text>
    </View>
  </View>
);

const chipStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: Spacing.lg,
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
export const OnBoarding2: React.FC<OnBoarding2Props> = ({ onNext, onSkip }) => {
  const { height } = useWindowDimensions();
  const illSize = Math.max(140, Math.min(220, height * 0.38));
  const illMarginBottom = height < 700 ? Spacing.lg : Spacing.xl * 1.5;

  const floatAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const btnScale  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,  duration: 2000, useNativeDriver: true }),
      ]),
    ).start();
  }, [fadeAnim, floatAnim, slideAnim]);

  const pressIn  = () => Animated.timing(btnScale, { toValue: 0.97, duration: 80,  useNativeDriver: true }).start();
  const pressOut = () => Animated.timing(btnScale, { toValue: 1,    duration: 120, useNativeDriver: true }).start();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor={Colors.dominant} />

      {/* ── Ambient glows ────────────────────────────────────────────────── */}
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
        <HeroIllustrationFrame
          size={illSize}
          marginBottom={illMarginBottom}
          floatOffset={floatAnim}
          badges={[
            {
              corner: 'topRight',
              icon: <BookOpen size={18} color={Colors.white} strokeWidth={2.2} />,
            },
            {
              corner: 'bottomLeft',
              tint: 'teal',
              icon: <Sparkles size={18} color={Colors.white} strokeWidth={2.2} />,
            },
          ]}
        >
          <RootsIllustration size={illSize} />
        </HeroIllustrationFrame>

        {/* Text */}
        <View style={styles.textBlock}>
          <Text style={styles.headline} accessibilityRole="header">
            Learn your roots.
          </Text>
          <Text style={styles.subheadline}>
            Discover dialects and traditions from your own village, taught through fun daily lessons.
          </Text>
        </View>

        {/* Feature chips */}
        <FeatureChips />
      </Animated.View>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <PaginationDots active={1} />

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

export default OnBoarding2;
