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
const PinDots: React.FC<{ filled: number }> = ({ filled }) => (
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
          i < filled ? styles.pinDotFilled : styles.pinDotEmpty,
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
// Segmented tab control
// ─────────────────────────────────────────────────────────────────────────────
const SegmentedControl: React.FC<{
  active: AuthTab;
  onChange: (t: AuthTab) => void;
}> = ({ active, onChange }) => (
  <View style={styles.segmentedControl} accessibilityRole="tablist">
    {(['pin', 'fingerprint'] as AuthTab[]).map((tab) => {
      const isActive = active === tab;
      const label = tab === 'pin' ? 'Use PIN' : 'Use Fingerprint';
      return (
        <Pressable
          key={tab}
          onPress={() => onChange(tab)}
          style={[styles.segmentTab, isActive && styles.segmentTabActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: isActive }}
          accessibilityLabel={label}
        >
          <Text style={[styles.segmentTabText, isActive && styles.segmentTabTextActive]}>
            {label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onSignUp,
  onForgotPin,
}) => {
  const [phone, setPhone] = useState('');
  const [activeTab, setActiveTab] = useState<AuthTab>('pin');
  const [pin, setPin] = useState('');

  const handleNumKey = (key: string) => {
    if (key === 'delete') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + key;
    setPin(next);

    // When 4 digits are entered, immediately navigate to the next screen
    if (next.length === PIN_LENGTH) {
      setTimeout(() => {
        onLoginSuccess?.();
      }, 250);
    }
  };

  const handleFingerprintPress = () => {
    // Navigate on fingerprint simulation
    onLoginSuccess?.();
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
                onChangeText={setPhone}
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
          </View>

          {/* Segmented control */}
          <SegmentedControl active={activeTab} onChange={setActiveTab} />

          {/* ── PIN view ──────────────────────────────────────────────────── */}
          {activeTab === 'pin' && (
            <View style={styles.pinView}>
              {/* PIN dots */}
              <PinDots filled={pin.length} />

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
                style={styles.fingerprintCircle}
                accessibilityRole="button"
                accessibilityLabel="Authenticate with fingerprint"
              >
                <Fingerprint size={48} color={Colors.secondary} strokeWidth={1.5} />
              </Pressable>
              <Text style={styles.fingerprintHint}>
                Touch the sensor to log in.
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

  // ── Segmented control ─────────────────────────────────────────────────────
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#dde3ef', // surface-variant
    borderRadius: Radii.lg,
    padding: 4,
    marginBottom: Spacing.md,
    width: '100%',
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.md,
  },
  segmentTabActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentTabText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    lineHeight: 20,
    letterSpacing: 0.5,
    color: Colors.textMuted,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  segmentTabTextActive: {
    color: Colors.accent,
  },

  // ── PIN view ──────────────────────────────────────────────────────────────
  pinView: {
    alignItems: 'center',
    width: '100%',
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
