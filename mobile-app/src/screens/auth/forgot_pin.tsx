import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
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
import { BackButton } from '../../components/common';
import { authApi } from '../../services/api/authApi';
import { ApiError } from '../../services/api/client';
import { Colors, Typography, Spacing, Radii } from '../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface ForgotPinScreenProps {
  /** Called once phone + NIC are verified — navigate to OTP verification */
  onVerified?: (details: { phone: string; nic: string }) => void;
  /** Navigate back to login */
  onBack?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export const ForgotPinScreen: React.FC<ForgotPinScreenProps> = ({
  onVerified,
  onBack,
}) => {
  const [phone, setPhone] = useState('');
  const [nic, setNic] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleContinue = async () => {
    const newErrors: Record<string, string> = {};
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    if (!nic.trim()) newErrors.nic = 'NIC number is required';
    setErrors(newErrors);
    setFormError(null);

    if (Object.keys(newErrors).length > 0 || checking) return;

    const trimmedPhone = phone.trim();
    const trimmedNic = nic.trim();

    setChecking(true);
    try {
      await authApi.forgotPin({ phoneNumber: trimmedPhone, nicNumber: trimmedNic });
      setChecking(false);
      onVerified?.({ phone: trimmedPhone, nic: trimmedNic });
    } catch (err) {
      setChecking(false);
      setFormError(
        err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor={Colors.dominant} />

      {/* ── Ambient glows ──────────────────────────────────────────────────── */}
      <View style={[styles.glow, styles.glowTopLeft]} pointerEvents="none" />
      <View style={[styles.glow, styles.glowBottomRight]} pointerEvents="none" />

      {/* ── Back button ────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <BackButton onPress={onBack} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Heading */}
          <View style={styles.headingBlock}>
            <Text style={styles.headline} accessibilityRole="header">
              Forgot your PIN?
            </Text>
            <Text style={styles.subheadline}>
              Enter your phone number and NIC to verify it's you.
            </Text>
          </View>

          {/* Phone Number */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <View style={[styles.inputBox, !!errors.phone && styles.inputBoxError]}>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={(t) => {
                  setPhone(t);
                  if (errors.phone) setErrors((e) => ({ ...e, phone: '' }));
                }}
                placeholder="Enter your phone number"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                returnKeyType="next"
                {...Platform.select({ android: { includeFontPadding: false } })}
              />
            </View>
            {!!errors.phone && <Text style={styles.errorMsg}>{errors.phone}</Text>}
          </View>

          {/* NIC Number */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>NIC Number</Text>
            <View style={[styles.inputBox, !!errors.nic && styles.inputBoxError]}>
              <TextInput
                style={styles.textInput}
                value={nic}
                onChangeText={(t) => {
                  setNic(t);
                  if (errors.nic) setErrors((e) => ({ ...e, nic: '' }));
                }}
                placeholder="Enter your NIC number"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                returnKeyType="done"
                {...Platform.select({ android: { includeFontPadding: false } })}
              />
            </View>
            {!!errors.nic && <Text style={styles.errorMsg}>{errors.nic}</Text>}
          </View>

          {!!formError && <Text style={styles.formErrorText}>{formError}</Text>}

          {/* Continue */}
          <Pressable
            onPress={handleContinue}
            disabled={checking}
            accessibilityRole="button"
            accessibilityLabel="Continue"
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.primaryBtnPressed,
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {checking ? 'Checking…' : 'Continue'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
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

  // ── Scroll content ─────────────────────────────────────────────────────────
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
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

  // ── Field groups ───────────────────────────────────────────────────────────
  fieldGroup: {
    marginBottom: 16,
    width: '100%',
  },
  fieldLabel: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text,
    marginBottom: 6,
    marginLeft: 2,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: 'rgba(195, 198, 207, 0.8)',
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    height: 50,
  },
  inputBoxError: {
    borderColor: '#ba1a1a',
  },
  textInput: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: Colors.text,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  errorMsg: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: '#ba1a1a',
    marginTop: 4,
    marginLeft: 4,
  },
  formErrorText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: '#ba1a1a',
    textAlign: 'center',
    marginBottom: Spacing.sm,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },

  // ── Continue button ────────────────────────────────────────────────────────
  primaryBtn: {
    width: '100%',
    minHeight: 56,
    backgroundColor: Colors.secondary,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
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

export default ForgotPinScreen;
