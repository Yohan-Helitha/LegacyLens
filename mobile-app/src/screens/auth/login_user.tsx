import React, { useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Smartphone, Delete, Fingerprint } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { SegmentedControl } from '../../components/common';
import { authApi } from '../../services/api/authApi';
import { ApiError } from '../../services/api/client';
import { useAuthStore } from '../../store/authStore';
import { Colors, Typography, Spacing, Radii } from '../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type AuthTab = 'pin' | 'fingerprint';

interface LoginScreenProps {
  /** Navigate to the main/home screen after successful login */
  onLoginSuccess?: () => void;
  /** Navigate to the sign-up / registration screen */
  onSignUp?: () => void;
  /** Navigate to the forgot-PIN recovery flow */
  onForgotPin?: () => void;
  /** Called when the backend reports this phone number hasn't finished OTP verification */
  onNeedsVerification?: (phone: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const PIN_LENGTH = 4;

const PIN_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'delete'],
];

// ─────────────────────────────────────────────────────────────────────────────
// PIN dot indicator
// ─────────────────────────────────────────────────────────────────────────────
const PinDots: React.FC<{ filled: number; error?: boolean }> = ({ filled, error }) => (
  <View
    style={styles.pinDotsRow}
    accessible
    accessibilityLabel={`PIN: ${filled} of ${PIN_LENGTH} digits entered`}
  >
    {Array.from({ length: PIN_LENGTH }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.pinDot,
          i < filled ? (error ? styles.pinDotError : styles.pinDotFilled) : styles.pinDotEmpty,
        ]}
      />
    ))}
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Single numpad key
// ─────────────────────────────────────────────────────────────────────────────
const NumKey: React.FC<{
  label: string;
  onPress: () => void;
}> = ({ label, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.timing(scaleAnim, { toValue: 0.88, duration: 80, useNativeDriver: true }).start();

  const handlePressOut = () =>
    Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }).start();

  if (label === '') {
    // Empty spacer cell
    return <View style={styles.numKey} />;
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.numKey}
        accessibilityRole="button"
        accessibilityLabel={label === 'delete' ? 'Backspace' : label}
        hitSlop={8}
      >
        {label === 'delete' ? (
          <Delete size={28} color={Colors.secondary} strokeWidth={1.8} />
        ) : (
          <Text style={styles.numKeyLabel}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onSignUp,
  onForgotPin,
  onNeedsVerification,
}) => {
  const [phone, setPhone] = useState('');
  const [activeTab, setActiveTab] = useState<AuthTab>('pin');
  const [pin, setPin] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);

  const fingerprintEnabled = useAuthStore((s) => s.fingerprintEnabled);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 7, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -7, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  };

  const attemptLogin = async (enteredPin: string) => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setPhoneError('Enter your phone number first');
      setPin('');
      return;
    }

    setPhoneError(null);
    setAuthError(null);
    setSubmitting(true);
    try {
      const response = await authApi.login({ phoneNumber: trimmedPhone, pin: enteredPin });
      useAuthStore.getState().setSession(response.token, {
        userId: response.userId,
        fullName: response.fullName,
        phoneNumber: response.phoneNumber,
        roles: response.roles,
      });
      setSubmitting(false);
      onLoginSuccess?.();
    } catch (err) {
      setSubmitting(false);
      setPin('');

      // Registered but never finished OTP verification — send them to
      // finish that instead of just failing the login with no way out.
      if (err instanceof ApiError && err.status === 403) {
        onNeedsVerification?.(trimmedPhone);
        return;
      }

      setAuthError(
        err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
      );
      triggerShake();
    }
  };

  const handleNumKey = (key: string) => {
    if (submitting) return;
    if (key === 'delete') {
      setPin((p) => p.slice(0, -1));
      if (authError) setAuthError(null);
      return;
    }
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + key;
    setPin(next);
    if (authError) setAuthError(null);

    if (next.length === PIN_LENGTH) {
      setTimeout(() => attemptLogin(next), 200);
    }
  };

  const handleFingerprintPress = async () => {
    // There's no biometric-login endpoint on the backend (login is
    // phone+PIN only) — device biometrics unlock a session cached from a
    // real prior PIN login instead of authenticating against the server.
    if (biometricBusy) return;
    setBiometricError(null);

    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    if (!hasHardware || !isEnrolled) {
      setBiometricError("Fingerprint login isn't set up on this device.");
      return;
    }

    if (!fingerprintEnabled) {
      setBiometricError('Enable fingerprint login from the app first.');
      return;
    }

    if (!useAuthStore.getState().token) {
      setBiometricError('Log in with your PIN once to enable fingerprint login.');
      return;
    }

    setBiometricBusy(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Log in to Legacy Lens',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      setBiometricBusy(false);
      if (result.success) {
        onLoginSuccess?.();
      }
    } catch {
      setBiometricBusy(false);
      setBiometricError('Something went wrong. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor={Colors.dominant} />

      {/* ── Ambient glows ────────────────────────────────────────────────── */}
      <View style={[styles.glow, styles.glowTopLeft]} pointerEvents="none" />
      <View style={[styles.glow, styles.glowBottomRight]} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Centred card container ────────────────────────────────────────── */}
        <View style={styles.container}>
          {/* Heading */}
          <View style={styles.headingBlock}>
            <Text style={styles.headline} accessibilityRole="header">
              Welcome back
            </Text>
            <Text style={styles.subheadline}>
              Log in to continue your curation.
            </Text>
          </View>

          {/* Phone number field */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <View style={styles.inputRow}>
              <Smartphone
                size={22}
                color={Colors.textMuted}
                strokeWidth={1.75}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={(t) => {
                  setPhone(t);
                  if (phoneError) setPhoneError(null);
                }}
                placeholder="(555) 123-4567"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                accessibilityLabel="Phone number"
                returnKeyType="done"
                {...Platform.select({ android: { includeFontPadding: false } })}
              />
            </View>
            {!!phoneError && <Text style={styles.fieldErrorText}>{phoneError}</Text>}
          </View>

          {/* Segmented control */}
          <View style={{ width: '100%', marginBottom: Spacing.md }}>
            <SegmentedControl
              tabs={[
                { key: 'pin', label: 'Use PIN' },
                { key: 'fingerprint', label: 'Use Fingerprint' },
              ]}
              active={activeTab}
              onChange={(tab) => {
                setActiveTab(tab);
                setBiometricError(null);
              }}
            />
          </View>

          {/* ── PIN view ──────────────────────────────────────────────────── */}
          {activeTab === 'pin' && (
            <View style={styles.pinView}>
              {!!authError && <Text style={styles.authErrorText}>{authError}</Text>}

              {/* PIN dots */}
              <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                <PinDots filled={pin.length} error={!!authError} />
              </Animated.View>

              {/* 3x4 Numpad Grid */}
              <View style={styles.numPad}>
                {PIN_ROWS.map((row, rIdx) => (
                  <View key={rIdx} style={styles.numRow}>
                    {row.map((key, kIdx) => (
                      <NumKey
                        key={kIdx}
                        label={key}
                        onPress={() => handleNumKey(key)}
                      />
                    ))}
                  </View>
                ))}
              </View>

              {/* Forgot PIN */}
              <Pressable
                onPress={onForgotPin}
                accessibilityRole="link"
                accessibilityLabel="Forgot PIN?"
                hitSlop={8}
              >
                <Text style={styles.forgotPin}>Forgot PIN?</Text>
              </Pressable>
            </View>
          )}

          {/* ── Fingerprint view ──────────────────────────────────────────── */}
          {activeTab === 'fingerprint' && (
            <View style={styles.fingerprintView}>
              <Pressable
                onPress={handleFingerprintPress}
                disabled={biometricBusy}
                style={styles.fingerprintCircle}
                accessibilityRole="button"
                accessibilityLabel="Authenticate with fingerprint"
              >
                <Fingerprint size={48} color={Colors.secondary} strokeWidth={1.5} />
              </Pressable>
              <Text
                style={[styles.fingerprintHint, !!biometricError && styles.fingerprintHintError]}
              >
                {biometricError ?? (biometricBusy ? 'Verifying…' : 'Touch the sensor to log in.')}
              </Text>
            </View>
          )}

          {/* ── Sign-up footer — directly below PIN / Fingerprint section ───── */}
          <View style={styles.signUpFooter}>
            <Text style={styles.signUpPrompt}>Don't have an account? </Text>
            <Pressable
              onPress={onSignUp}
              accessibilityRole="link"
              accessibilityLabel="Sign up"
              hitSlop={8}
            >
              <Text style={styles.signUpLink}>Sign up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },

  // ── Ambient glows ─────────────────────────────────────────────────────────
  glow: {
    position: 'absolute',
    borderRadius: Radii.full,
  },
  glowTopLeft: {
    width: 300,
    height: 300,
    top: -80,
    left: -80,
    backgroundColor: 'rgba(15, 92, 92, 0.07)',
  },
  glowBottomRight: {
    width: 260,
    height: 260,
    bottom: -60,
    right: -60,
    backgroundColor: 'rgba(232, 121, 46, 0.06)',
  },

  // ── Layout ────────────────────────────────────────────────────────────────
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    alignItems: 'center',
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },

  // ── Heading ───────────────────────────────────────────────────────────────
  headingBlock: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    width: '100%',
  },
  headline: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size3XL,
    lineHeight: 44,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  subheadline: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeLG,
    lineHeight: 28,
    color: Colors.textMuted,
    textAlign: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },

  // ── Phone field ───────────────────────────────────────────────────────────
  fieldBlock: {
    marginBottom: Spacing.md,
    width: '100%',
  },
  fieldLabel: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    lineHeight: 20,
    letterSpacing: 0.5,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    marginLeft: 4,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: 'rgba(195, 198, 207, 0.8)',
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    height: 54,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeLG,
    lineHeight: 28,
    color: Colors.text,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  fieldErrorText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: '#ba1a1a',
    marginTop: 4,
    marginLeft: 4,
  },

  // ── PIN view ──────────────────────────────────────────────────────────────
  pinView: {
    alignItems: 'center',
    width: '100%',
  },
  authErrorText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: '#ba1a1a',
    textAlign: 'center',
    marginBottom: Spacing.sm,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },

  // PIN dots
  pinDotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: Spacing.md,
    justifyContent: 'center',
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: Radii.full,
  },
  pinDotFilled: {
    backgroundColor: Colors.accent,
  },
  pinDotEmpty: {
    backgroundColor: '#c3c6cf',
  },
  pinDotError: {
    backgroundColor: '#ba1a1a',
  },

  // 3x4 Numpad
  numPad: {
    width: '100%',
    maxWidth: 280,
    gap: 12,
    marginBottom: Spacing.sm,
    alignSelf: 'center',
  },
  numRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  numKey: {
    width: 64,
    height: 64,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numKeyLabel: {
    fontFamily: Typography.fontDisplay,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '600',
    color: Colors.secondary,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },

  // Forgot PIN
  forgotPin: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    lineHeight: 20,
    letterSpacing: 0.4,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.xs,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },

  // ── Fingerprint view ──────────────────────────────────────────────────────
  fingerprintView: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  fingerprintCircle: {
    width: 96,
    height: 96,
    borderRadius: Radii.full,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: 'rgba(195, 198, 207, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  fingerprintHint: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: Colors.textMuted,
    textAlign: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  fingerprintHintError: {
    color: '#ba1a1a',
  },

  // ── Sign-up footer ────────────────────────────────────────────────────────
  signUpFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: Spacing.xs,
    width: '100%',
  },
  signUpPrompt: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: Colors.textMuted,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  signUpLink: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: Colors.accent,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});

export default LoginScreen;
