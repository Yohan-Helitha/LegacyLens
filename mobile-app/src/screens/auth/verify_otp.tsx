import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BackButton, OtpBoxes, SuccessMark } from '../../components/common';
import { ApiError } from '../../services/api/client';
import { Colors, Typography, Spacing, Radii } from '../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface VerifyOtpScreenProps {
  /** Verifies the entered code. Throw to show the error and let the user retry. */
  onSubmit: (code: string) => Promise<void>;
  /** Requests a fresh code. Throw to surface the error (e.g. a cooldown message). */
  onResend: () => Promise<void>;
  /** Called with the verified code after a successful verify + success animation */
  onComplete?: (code: string) => void;
  /** Navigate back to the previous screen */
  onBack?: () => void;
  /** Phone number the code was sent to, shown in the subheading */
  phone?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export const VerifyOtpScreen: React.FC<VerifyOtpScreenProps> = ({
  onSubmit,
  onResend,
  onComplete,
  onBack,
  phone,
}) => {
  const [otp, setOtp] = useState('');
  const [otpErr, setOtpErr] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const inputRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // ── Resend cooldown timer ─────────────────────────────────────────────────
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // ── Helpers ────────────────────────────────────────────────────────────────
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

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (text: string) => {
    if (verifying) return;
    const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(digits);
    if (otpErr) setOtpErr(false);

    if (digits.length === OTP_LENGTH) {
      setTimeout(async () => {
        setVerifying(true);
        try {
          await onSubmit(digits);
          setVerifying(false);
          setSuccess(true);
          setTimeout(() => onComplete?.(digits), 1200);
        } catch (err) {
          setVerifying(false);
          setOtpErr(true);
          setErrorMessage(
            err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
          );
          triggerShake();
          setTimeout(() => {
            setOtp('');
            setOtpErr(false);
          }, 900);
        }
      }, 150);
    }
  };

  const handleResend = () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setResendError(null);

    onResend()
      .then(() => {
        setResending(false);
        setOtp('');
        setOtpErr(false);
        setCooldown(RESEND_COOLDOWN_SECONDS);
        inputRef.current?.focus();
      })
      .catch((err) => {
        setResending(false);
        setResendError(
          err instanceof ApiError ? err.message : 'Could not resend the code. Try again.',
        );
      });
  };

  const focusInput = () => inputRef.current?.focus();

  // ── Dynamic copy ───────────────────────────────────────────────────────────
  const heading = success ? 'Verified!' : 'Verify your number';
  const subheading = success
    ? 'You’re all set. One moment…'
    : verifying
      ? 'Verifying…'
      : phone
        ? `Enter the 6-digit code sent to ${phone}.`
        : 'Enter the 6-digit code we sent you.';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor={Colors.dominant} />

      {/* ── Ambient glows ──────────────────────────────────────────────────── */}
      <View style={[styles.glow, styles.glowTopLeft]} pointerEvents="none" />
      <View style={[styles.glow, styles.glowBottomRight]} pointerEvents="none" />

      {/* ── Back button ────────────────────────────────────────────────────── */}
      {!success && (
        <View style={styles.topBar}>
          <BackButton onPress={onBack} />
        </View>
      )}

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <View style={styles.container}>
        <Animated.View style={[styles.contentWrapper, { opacity: fadeAnim }]}>
          {/* Heading */}
          <View style={styles.headingBlock}>
            {success && <SuccessMark />}
            <Text style={styles.headline} accessibilityRole="header">
              {heading}
            </Text>
            <Text style={[styles.subheadline, otpErr && styles.subheadlineError]}>
              {otpErr ? (errorMessage ?? 'That code isn’t right — try again.') : subheading}
            </Text>
          </View>

          {/* OTP boxes + hidden input */}
          {!success && (
            <>
              <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                <Pressable onPress={focusInput} accessibilityRole="button" accessibilityLabel="Enter code">
                  <OtpBoxes value={otp} length={OTP_LENGTH} error={otpErr} focused={inputFocused} />
                </Pressable>
              </Animated.View>

              <TextInput
                ref={inputRef}
                value={otp}
                onChangeText={handleChange}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                editable={!verifying}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                autoFocus
                caretHidden
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                style={styles.hiddenInput}
                accessibilityLabel="One-time verification code"
              />

              {/* Resend code link */}
              <Pressable
                onPress={handleResend}
                disabled={cooldown > 0 || resending}
                accessibilityRole="button"
                accessibilityLabel="Resend code"
                hitSlop={8}
                style={{ marginTop: Spacing.md }}
              >
                <Text style={[styles.resendLink, (cooldown > 0 || resending) && styles.resendLinkDisabled]}>
                  {resending
                    ? 'Resending…'
                    : cooldown > 0
                      ? `Resend code in ${cooldown}s`
                      : 'Resend code'}
                </Text>
              </Pressable>
              {!!resendError && <Text style={styles.resendErrorText}>{resendError}</Text>}
            </>
          )}
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

  // ── Top bar ────────────────────────────────────────────────────────────────
  topBar: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },

  // ── Container ──────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  contentWrapper: {
    alignItems: 'center',
    width: '100%',
  },

  // ── Heading ────────────────────────────────────────────────────────────────
  headingBlock: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
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
    fontSize: Typography.sizeLG,
    lineHeight: 28,
    color: Colors.textMuted,
    textAlign: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  subheadlineError: {
    color: '#ba1a1a',
  },

  // ── Hidden input ───────────────────────────────────────────────────────────
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },

  // ── Resend link ────────────────────────────────────────────────────────────
  resendLink: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    lineHeight: 20,
    letterSpacing: 0.4,
    color: Colors.accent,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  resendLinkDisabled: {
    color: Colors.textMuted,
  },
  resendErrorText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: '#ba1a1a',
    marginTop: Spacing.xs,
    textAlign: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});

export default VerifyOtpScreen;
