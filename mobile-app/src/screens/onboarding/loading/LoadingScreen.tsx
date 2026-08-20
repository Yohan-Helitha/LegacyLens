import React, { useEffect, useRef, useCallback } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors, Typography, Spacing } from '../../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface LoadingScreenProps {
  /** Called once fonts/assets are ready — navigate away from here */
  onFinish?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Logo mark — pure SVG, no external assets required
// ─────────────────────────────────────────────────────────────────────────────
const LogoMark: React.FC<{ ringAnim: Animated.Value; coreAnim: Animated.Value }> = ({
  ringAnim,
  coreAnim,
}) => {
  const ringRotate = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const coreScale = coreAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.35, 1],
  });

  const coreOpacity = coreAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.65, 1],
  });

  return (
    <View style={styles.logoContainer}>
      {/* Outer ring — slow continuous rotation */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ rotate: ringRotate }] },
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 120 120" fill="none">
          <Circle
            cx="60" cy="60" r="50"
            stroke={Colors.secondary}
            strokeWidth="3.5"
            opacity={0.85}
          />
        </Svg>
      </Animated.View>

      {/* Static inner dashed ring + soundwave bars */}
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 120 120"
        fill="none"
        style={StyleSheet.absoluteFill}
      >
        {/* Dashed inner ring */}
        <Circle
          cx="60" cy="60" r="40"
          stroke={Colors.secondary}
          strokeWidth="1.5"
          strokeDasharray="5 4"
          opacity={0.45}
        />
        {/* Soundwave / storytelling bars */}
        <Path
          d="M45 48 V72 M52.5 38 V82 M60 28 V92 M67.5 38 V82 M75 48 V72"
          stroke={Colors.secondary}
          strokeWidth="3"
          strokeLinecap="round"
          opacity={0.75}
        />
      </Svg>

      {/* Mango accent core — pulsing */}
      <Animated.View
        style={[
          styles.logoCoreWrapper,
          {
            transform: [{ scale: coreScale }],
            opacity: coreOpacity,
          },
        ]}
      >
        <View style={styles.logoCore} />
      </Animated.View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Loading dots — three staggered mango dots
// ─────────────────────────────────────────────────────────────────────────────
const LoadingDots: React.FC<{ visible: boolean }> = ({ visible }) => {
  const dots = [useRef(new Animated.Value(0)).current,
                useRef(new Animated.Value(0)).current,
                useRef(new Animated.Value(0)).current];

  useEffect(() => {
    if (!visible) return;

    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay((2 - i) * 180),
        ])
      )
    );

    Animated.parallel(animations).start();

    return () => animations.forEach(a => a.stop());
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View
      style={styles.dotsRow}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      {dots.map((dot, i) => {
        const translateY = dot.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -10],
        });
        const scale = dot.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.2],
        });
        const opacity = dot.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1],
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                transform: [{ translateY }, { scale }],
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onFinish }) => {
  // Respect the system's reduce-motion preference
  const [reduceMotion, setReduceMotion] = React.useState(false);

  // Animation values
  const ringAnim     = useRef(new Animated.Value(0)).current;
  const coreAnim     = useRef(new Animated.Value(0)).current;
  const logoEnter    = useRef(new Animated.Value(0)).current;
  const textEnter    = useRef(new Animated.Value(0)).current;
  const taglineEnter = useRef(new Animated.Value(0)).current;
  const dotsEnter    = useRef(new Animated.Value(0)).current;
  // Controls the full-screen fade-out before leaving
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  /** Fade-out then call onFinish */
  const handleFinish = useCallback(() => {
    if (!onFinish) return;
    Animated.timing(screenOpacity, {
      toValue: 0,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => onFinish());
  }, [onFinish, screenOpacity]);

  useEffect(() => {
    if (reduceMotion) {
      // Skip animations — just show everything fully
      [logoEnter, textEnter, taglineEnter, dotsEnter].forEach(v => v.setValue(1));
      // Still honour the 3-second timer
      const t = setTimeout(handleFinish, 3_000);
      return () => clearTimeout(t);
    }

    // ── Entrance sequence ─────────────────────────────────────────────────
    Animated.stagger(120, [
      Animated.spring(logoEnter, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(textEnter, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(taglineEnter, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(dotsEnter, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // ── Continuous logo animations ────────────────────────────────────────
    // Outer ring — one full rotation per 20 s
    Animated.loop(
      Animated.timing(ringAnim, {
        toValue: 1,
        duration: 20_000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Core dot pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(coreAnim, {
          toValue: 1,
          duration: 1_200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(coreAnim, {
          toValue: 0,
          duration: 1_200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // ── 3-second auto-advance ─────────────────────────────────────────────
    const timer = setTimeout(handleFinish, 3_000);
    return () => clearTimeout(timer);
  }, [reduceMotion, handleFinish]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper: entrance animation style
  const enterStyle = (anim: Animated.Value, offsetY = 20) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [offsetY, 0],
        }),
      },
    ],
  });

  return (
    <Animated.View style={[styles.screenWrap, { opacity: screenOpacity }]}>
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Ambient background glows — rendered as coloured blobs */}
      <View style={[styles.glow, styles.glowTopLeft]}  pointerEvents="none" />
      <View style={[styles.glow, styles.glowBottomRight]} pointerEvents="none" />

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View style={enterStyle(logoEnter, 16)}>
          <LogoMark ringAnim={ringAnim} coreAnim={coreAnim} />
        </Animated.View>

        {/* Wordmark */}
        <Animated.Text
          style={[styles.wordmark, enterStyle(textEnter)]}
          accessibilityRole="header"
        >
          Legacy Lens
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, enterStyle(taglineEnter)]}>
          Preserving voices, one story at a time.
        </Animated.Text>

        {/* Loading dots */}
        <Animated.View style={{ opacity: dotsEnter }}>
          <LoadingDots visible />
        </Animated.View>
      </View>
    </SafeAreaView>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const LOGO_SIZE = 120;
const DOT_SIZE  = 10;

const styles = StyleSheet.create({
  screenWrap: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.dominant,
  },

  // ── Ambient glows ──────────────────────────────────────────────────────────
  glow: {
    position: 'absolute',
    borderRadius: 9999,
    // React Native doesn't support radial-gradient natively;
    // we simulate it with a large, semi-transparent circle.
    // For a true gradient, swap for expo-linear-gradient or react-native-linear-gradient.
  },
  glowTopLeft: {
    width: 320,
    height: 320,
    top: -80,
    left: -80,
    backgroundColor: 'rgba(15, 92, 92, 0.08)',
  },
  glowBottomRight: {
    width: 280,
    height: 280,
    bottom: -70,
    right: -70,
    backgroundColor: 'rgba(232, 121, 46, 0.07)',
  },

  // ── Content ────────────────────────────────────────────────────────────────
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },

  // ── Logo ───────────────────────────────────────────────────────────────────
  logoContainer: {
    width:  LOGO_SIZE,
    height: LOGO_SIZE,
    marginBottom: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCoreWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  logoCore: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.accent,
    // React Native shadow (iOS)
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    // Android elevation
    elevation: 4,
  },

  // ── Text ───────────────────────────────────────────────────────────────────
  wordmark: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size4XL,
    lineHeight: Typography.size4XL * 1.15,
    color: Colors.secondary,
    letterSpacing: -0.8,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    ...Platform.select({
      android: { includeFontPadding: false },
    }),
  },
  tagline: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeLG,
    lineHeight: Typography.lineHeightBody,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
    marginBottom: Spacing.xxl,
  },

  // ── Loading dots ───────────────────────────────────────────────────────────
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 32,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 3,
  },
});

export default LoadingScreen;
