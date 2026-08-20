import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as LocalAuthentication from 'expo-local-authentication';
import { Fingerprint } from 'lucide-react-native';
import { GhostButton } from '../../components/common';
import { usePressScale } from '../../hooks/usePressScale';
import { useAuthStore } from '../../store/authStore';
import { Colors, Typography, Spacing, Radii } from '../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface FingerprintScreenProps {
  /** Called after fingerprint login is successfully enabled */
  onComplete?: () => void;
  /** Called when the user skips fingerprint setup */
  onSkip?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export const FingerprintScreen: React.FC<FingerprintScreenProps> = ({
  onComplete,
  onSkip,
}) => {
  const [enabling, setEnabling] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(1)).current;
  const enablePress = usePressScale();

  useEffect(() => {
    slideAnim.setValue(40);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const pulseBadge = () => {
    Animated.sequence([
      Animated.timing(badgeScale, { toValue: 1.06, duration: 120, useNativeDriver: true }),
      Animated.timing(badgeScale, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleEnable = async () => {
    if (enabling) return;
    setEnabling(true);
    pulseBadge();
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm your fingerprint to enable quick login',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (result.success) {
        useAuthStore.getState().setFingerprintEnabled(true);
        onComplete?.();
      }
    } catch {
      Alert.alert(
        'Something went wrong',
        'We couldn’t verify your fingerprint. Please try again.',
      );
    } finally {
      setEnabling(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor={Colors.dominant} />

      {/* ── Ambient glows ──────────────────────────────────────────────────── */}
      <View style={[styles.glow, styles.glowTopLeft]} pointerEvents="none" />
      <View style={[styles.glow, styles.glowBottomRight]} pointerEvents="none" />

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <Animated.View
        style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
      >
        {/* Fingerprint badge */}
        <Animated.View style={[styles.badge, { transform: [{ scale: badgeScale }] }]}>
          <Fingerprint size={64} color={Colors.white} strokeWidth={1.3} />
        </Animated.View>

        {/* Heading */}
        <View style={styles.headingBlock}>
          <Text style={styles.headline} accessibilityRole="header">
            Enable fingerprint login?
          </Text>
          <Text style={styles.subheadline}>
            Skip typing your PIN next time — just use your fingerprint.
          </Text>
        </View>
      </Animated.View>

      {/* ── Bottom actions ────────────────────────────────────────────────── */}
      <View style={styles.actions}>
        <Animated.View style={{ transform: [{ scale: enablePress.scale }], width: '100%' }}>
          <Pressable
            onPress={handleEnable}
            disabled={enabling}
            accessibilityRole="button"
            accessibilityLabel="Enable fingerprint"
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.primaryBtnPressed,
            ]}
            onPressIn={enablePress.onPressIn}
            onPressOut={enablePress.onPressOut}
          >
            <Text style={styles.primaryBtnText}>
              {enabling ? 'Verifying…' : 'Enable Fingerprint'}
            </Text>
          </Pressable>
        </Animated.View>

        <GhostButton label="Skip for now" onPress={onSkip} />
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

  // ── Ambient glows ──────────────────────────────────────────────────────────
  glow: {
    position: 'absolute',
    borderRadius: Radii.full,
  },
  glowTopLeft: {
    width: 320,
    height: 320,
    top: -90,
    left: -90,
    backgroundColor: 'rgba(15, 92, 92, 0.07)',
  },
  glowBottomRight: {
    width: 280,
    height: 280,
    bottom: -70,
    right: -70,
    backgroundColor: 'rgba(232, 121, 46, 0.06)',
  },

  // ── Main content ───────────────────────────────────────────────────────────
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },

  // ── Badge ──────────────────────────────────────────────────────────────────
  badge: {
    width: 128,
    height: 128,
    borderRadius: Radii.full,
    backgroundColor: Colors.secondary,
    borderWidth: 3,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },

  // ── Heading ────────────────────────────────────────────────────────────────
  headingBlock: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    maxWidth: 320,
  },
  headline: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size2XL,
    lineHeight: 40,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  subheadline: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: Colors.textMuted,
    textAlign: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },

  // ── Action buttons ─────────────────────────────────────────────────────────
  actions: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },

  // Primary — "Enable Fingerprint"
  primaryBtn: {
    width: '100%',
    minHeight: 56,
    backgroundColor: Colors.secondary,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.1,
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

export default FingerprintScreen;
