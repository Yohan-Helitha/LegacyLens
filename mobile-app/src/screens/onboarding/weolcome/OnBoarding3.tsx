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
import { MapPin, Sparkles, Mountain, Waves, Palmtree } from 'lucide-react-native';
import { HeroIllustrationFrame, PaginationDots } from '../../../components/common';
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
// Custom SVG Living Archive Map Vector Illustration
// ─────────────────────────────────────────────────────────────────────────────
const ArchiveMapIllustration: React.FC<{ size: number }> = ({ size }) => {
  const svgSize = size * 0.58;
  return (
    <Svg width={svgSize} height={svgSize} viewBox="0 0 100 100" fill="none">
      <Defs>
        <LinearGradient id="mapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#EFF4F2" />
        </LinearGradient>
      </Defs>

      {/* Folded Map Shape */}
      <Path
        d="M12 24 L36 18 L64 24 L88 18 V76 L64 82 L36 76 L12 82 Z"
        fill="url(#mapGrad)"
        stroke="#0F5C5C"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Map Fold Crease lines */}
      <Path d="M36 18 V76" stroke="#0F5C5C" strokeWidth="1.8" strokeDasharray="3 3" opacity={0.6} />
      <Path d="M64 24 V82" stroke="#0F5C5C" strokeWidth="1.8" strokeDasharray="3 3" opacity={0.6} />

      {/* Contour / Topographic lines */}
      <Path
        d="M20 40 C28 36, 42 42, 54 38 C68 34, 76 42, 82 40"
        stroke="#0F5C5C"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={0.5}
      />
      <Path
        d="M18 54 C30 50, 46 58, 58 52 C68 48, 76 56, 80 54"
        stroke="#0F5C5C"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={0.4}
      />
      <Path
        d="M22 66 C32 62, 44 68, 56 64 C66 60, 74 68, 80 66"
        stroke="#0F5C5C"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={0.3}
      />

      {/* Compass Rose Accent in Center */}
      <Circle cx="50" cy="50" r="10" stroke={Colors.accent} strokeWidth="1.5" opacity={0.7} />
      <Path d="M50 36 L50 64 M36 50 L64 50" stroke={Colors.accent} strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="50" cy="50" r="3.5" fill={Colors.accent} />

      {/* Map waypoint pins on map */}
      <Circle cx="28" cy="34" r="3" fill="#0F5C5C" />
      <Circle cx="72" cy="62" r="3" fill="#0F5C5C" />
    </Svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Region chips with Lucide Vector Icons
// ─────────────────────────────────────────────────────────────────────────────
const RegionChips: React.FC = () => (
  <View style={chipStyles.row}>
    <View style={chipStyles.chip}>
      <Mountain size={16} color={Colors.secondary} strokeWidth={2} />
      <Text style={chipStyles.label}>Kandy</Text>
    </View>
    <View style={chipStyles.chip}>
      <Waves size={16} color={Colors.secondary} strokeWidth={2} />
      <Text style={chipStyles.label}>Jaffna</Text>
    </View>
    <View style={chipStyles.chip}>
      <Palmtree size={16} color={Colors.secondary} strokeWidth={2} />
      <Text style={chipStyles.label}>Galle</Text>
    </View>
  </View>
);

const chipStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
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

    // CTA button pulse
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
        {/* Illustration */}
        <HeroIllustrationFrame
          size={illSize}
          marginBottom={illMarginBottom}
          floatOffset={floatAnim}
          badges={[
            {
              corner: 'bottomRight',
              tint: 'teal',
              icon: <MapPin size={19} color={Colors.white} strokeWidth={2.2} />,
            },
            {
              corner: 'topLeft',
              tint: 'orange',
              icon: <Sparkles size={18} color={Colors.white} strokeWidth={2.2} />,
            },
          ]}
        >
          <ArchiveMapIllustration size={illSize} />
        </HeroIllustrationFrame>

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
    color: Colors.secondary,
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
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.secondary,
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
