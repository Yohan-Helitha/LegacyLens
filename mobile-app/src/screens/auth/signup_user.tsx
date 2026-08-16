import React, { useRef, useState } from 'react';
import {
  Animated,
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
import { Colors, Typography, Spacing, Radii } from '../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type Step = 'details' | 'set-pin' | 'confirm-pin';

interface SignUpScreenProps {
  /** Called when registration is complete */
  onSignUpSuccess?: () => void;
  /** Navigate back to login */
  onLogin?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const PIN_LENGTH = 4;

const NUM_PAD_KEYS = [
  '1', '2', '3',
  '4', '5', '6',
  '7', '8', '9',
  '',  '0', '⌫',
];

// ─────────────────────────────────────────────────────────────────────────────
// Step progress indicator
// ─────────────────────────────────────────────────────────────────────────────
const STEPS: Step[] = ['details', 'set-pin', 'confirm-pin'];

const StepIndicator: React.FC<{ current: Step }> = ({ current }) => {
  const idx = STEPS.indexOf(current);
  return (
    <View style={stepStyles.row} accessibilityLabel={`Step ${idx + 1} of ${STEPS.length}`}>
      {STEPS.map((s, i) => (
        <View key={s} style={stepStyles.item}>
          <View
            style={[
              stepStyles.dot,
              i < idx  && stepStyles.dotDone,
              i === idx && stepStyles.dotActive,
              i > idx  && stepStyles.dotFuture,
            ]}
          />
          {i < STEPS.length - 1 && (
            <View style={[stepStyles.line, i < idx && stepStyles.lineDone]} />
          )}
        </View>
      ))}
    </View>
  );
};

const stepStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: Radii.full,
  },
  dotActive: {
    backgroundColor: Colors.accent,
    width: 12,
    height: 12,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  dotDone: {
    backgroundColor: Colors.secondary,
  },
  dotFuture: {
    backgroundColor: 'rgba(195, 198, 207, 0.8)',
  },
  line: {
    width: 36,
    height: 2,
    backgroundColor: 'rgba(195, 198, 207, 0.8)',
    marginHorizontal: 4,
  },
  lineDone: {
    backgroundColor: Colors.secondary,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Labelled text input field
// ─────────────────────────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  icon: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: TextInput['props']['keyboardType'];
  textContentType?: TextInput['props']['textContentType'];
  autoComplete?: TextInput['props']['autoComplete'];
  error?: string;
  secureTextEntry?: boolean;
}

const Field: React.FC<FieldProps> = ({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  textContentType,
  autoComplete,
  error,
  secureTextEntry,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={fieldStyles.block}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View
        style={[
          fieldStyles.row,
          focused && fieldStyles.rowFocused,
          !!error && fieldStyles.rowError,
        ]}
      >
        <Text style={fieldStyles.icon}>{icon}</Text>
        <TextInput
          style={fieldStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          keyboardType={keyboardType}
          textContentType={textContentType}
          autoComplete={autoComplete}
          secureTextEntry={secureTextEntry}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          returnKeyType="next"
          {...Platform.select({ android: { includeFontPadding: false } })}
        />
      </View>
      {!!error && <Text style={fieldStyles.errorText}>{error}</Text>}
    </View>
  );
};

const fieldStyles = StyleSheet.create({
  block: {
    marginBottom: Spacing.md,
  },
  label: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    lineHeight: 20,
    letterSpacing: 0.5,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    marginLeft: 4,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: 'rgba(195, 198, 207, 0.8)',
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  rowFocused: {
    borderColor: Colors.secondary,
  },
  rowError: {
    borderColor: '#ba1a1a',
  },
  icon: {
    fontSize: 20,
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
  errorText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    lineHeight: 18,
    color: '#ba1a1a',
    marginTop: 4,
    marginLeft: 4,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PIN dot indicator
// ─────────────────────────────────────────────────────────────────────────────
const PinDots: React.FC<{ filled: number; error?: boolean }> = ({ filled, error }) => (
  <View
    style={pinStyles.dotsRow}
    accessible
    accessibilityLabel={`PIN: ${filled} of ${PIN_LENGTH} digits entered`}
  >
    {Array.from({ length: PIN_LENGTH }).map((_, i) => (
      <View
        key={i}
        style={[
          pinStyles.dot,
          i < filled
            ? error
              ? pinStyles.dotError
              : pinStyles.dotFilled
            : pinStyles.dotEmpty,
        ]}
      />
    ))}
  </View>
);

const pinStyles = StyleSheet.create({
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: Radii.full,
  },
  dotFilled: { backgroundColor: Colors.accent },
  dotEmpty:  { backgroundColor: 'rgba(195, 198, 207, 0.8)' },
  dotError:  { backgroundColor: '#ba1a1a' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Numpad key
// ─────────────────────────────────────────────────────────────────────────────
const NumKey: React.FC<{ label: string; onPress: () => void }> = ({
  label,
  onPress,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn  = () =>
    Animated.timing(scale, { toValue: 0.88, duration: 80,  useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.timing(scale, { toValue: 1,    duration: 120, useNativeDriver: true }).start();

  if (label === '') return <View style={numStyles.key} />;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={numStyles.key}
        accessibilityRole="button"
        accessibilityLabel={label === '⌫' ? 'Backspace' : label}
        hitSlop={8}
      >
        <Text style={label === '⌫' ? numStyles.backspace : numStyles.digit}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const numStyles = StyleSheet.create({
  key: {
    width: 64,
    height: 64,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  digit: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    lineHeight: 32,
    color: Colors.secondary,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  backspace: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 22,
    color: Colors.secondary,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onSignUpSuccess,
  onLogin,
}) => {
  // ── Multi-step state ──────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('details');

  // Step 1 – personal details
  const [fullName, setFullName]   = useState('');
  const [phone,    setPhone]      = useState('');
  const [nameErr,  setNameErr]    = useState('');
  const [phoneErr, setPhoneErr]   = useState('');

  // Step 2 – set PIN
  const [pin,       setPin]       = useState('');

  // Step 3 – confirm PIN
  const [confirm,   setConfirm]   = useState('');
  const [pinErr,    setPinErr]    = useState(false);

  // Animations
  const shakeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(0)).current;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 40, useNativeDriver: true }),
    ]).start();
  };

  const slideIn = () => {
    slideAnim.setValue(40);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const goToStep = (next: Step) => {
    setStep(next);
    slideIn();
  };

  // ── Step 1 validation ─────────────────────────────────────────────────────
  const handleDetailsContinue = () => {
    let valid = true;
    if (!fullName.trim()) {
      setNameErr('Full name is required.');
      valid = false;
    } else {
      setNameErr('');
    }
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 7) {
      setPhoneErr('Enter a valid phone number.');
      valid = false;
    } else {
      setPhoneErr('');
    }
    if (valid) goToStep('set-pin');
  };

  // ── PIN step handlers ─────────────────────────────────────────────────────
  const handleSetPinKey = (key: string) => {
    if (key === '⌫') { setPin((p) => p.slice(0, -1)); return; }
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + key;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      setTimeout(() => goToStep('confirm-pin'), 200);
    }
  };

  const handleConfirmKey = (key: string) => {
    if (key === '⌫') {
      setConfirm((c) => c.slice(0, -1));
      setPinErr(false);
      return;
    }
    if (confirm.length >= PIN_LENGTH) return;
    const next = confirm + key;
    setConfirm(next);
    if (next.length === PIN_LENGTH) {
      setTimeout(() => {
        if (next === pin) {
          onSignUpSuccess?.();
        } else {
          setPinErr(true);
          triggerShake();
          setTimeout(() => {
            setConfirm('');
            setPinErr(false);
          }, 700);
        }
      }, 200);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const renderContent = () => {
    // ── Step 1: Personal details ─────────────────────────────────────────
    if (step === 'details') {
      return (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>

              <View style={styles.headingBlock}>
                <Text style={styles.headline} accessibilityRole="header">
                  Create account
                </Text>
                <Text style={styles.subheadline}>
                  Start preserving voices, one story at a time.
                </Text>
              </View>

              <Field
                label="Full Name"
                icon="👤"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                textContentType="name"
                autoComplete="name"
                error={nameErr}
              />

              <Field
                label="Phone Number"
                icon="📱"
                value={phone}
                onChangeText={setPhone}
                placeholder="(555) 123-4567"
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                error={phoneErr}
              />

              <Pressable
                onPress={handleDetailsContinue}
                style={styles.primaryBtn}
                accessibilityRole="button"
                accessibilityLabel="Continue"
              >
                <Text style={styles.primaryBtnText}>Continue</Text>
              </Pressable>

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      );
    }

    // ── Step 2: Set PIN ──────────────────────────────────────────────────
    if (step === 'set-pin') {
      return (
        <Animated.View
          style={[styles.pinView, { transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.headingBlock}>
            <Text style={styles.headline} accessibilityRole="header">
              Set your PIN
            </Text>
            <Text style={styles.subheadline}>
              Choose a 4-digit PIN to secure your account.
            </Text>
          </View>

          <PinDots filled={pin.length} />

          <View style={styles.numPad}>
            {NUM_PAD_KEYS.map((key, idx) => (
              <NumKey key={idx} label={key} onPress={() => handleSetPinKey(key)} />
            ))}
          </View>
        </Animated.View>
      );
    }

    // ── Step 3: Confirm PIN ──────────────────────────────────────────────
    return (
      <Animated.View
        style={[styles.pinView, { transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.headingBlock}>
          <Text style={styles.headline} accessibilityRole="header">
            Confirm your PIN
          </Text>
          <Text style={styles.subheadline}>
            {pinErr
              ? "PINs don't match — try again."
              : 'Re-enter the same 4-digit PIN.'}
          </Text>
        </View>

        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <PinDots filled={confirm.length} error={pinErr} />
        </Animated.View>

        <View style={styles.numPad}>
          {NUM_PAD_KEYS.map((key, idx) => (
            <NumKey key={idx} label={key} onPress={() => handleConfirmKey(key)} />
          ))}
        </View>

        {/* Back to set-pin */}
        <Pressable
          onPress={() => { setPin(''); setConfirm(''); setPinErr(false); goToStep('set-pin'); }}
          accessibilityRole="button"
          accessibilityLabel="Change PIN"
          hitSlop={8}
          style={{ marginTop: Spacing.md }}
        >
          <Text style={styles.forgotPin}>Change PIN</Text>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor={Colors.dominant} />

      {/* ── Ambient glows ─────────────────────────────────────────────────── */}
      <View style={[styles.glow, styles.glowTopLeft]}  pointerEvents="none" />
      <View style={[styles.glow, styles.glowBottomRight]} pointerEvents="none" />

      {/* ── Step indicator ─────────────────────────────────────────────────── */}
      <View style={styles.stepRow}>
        <StepIndicator current={step} />
      </View>

      {/* ── Page content (per-step) ─────────────────────────────────────────── */}
      <View style={styles.body}>
        {renderContent()}
      </View>

      {/* ── "Already have an account? Log in" footer ─────────────────────── */}
      <View style={styles.loginFooter}>
        <Text style={styles.loginPrompt}>Already have an account? </Text>
        <Pressable
          onPress={onLogin}
          accessibilityRole="link"
          accessibilityLabel="Log in"
          hitSlop={8}
        >
          <Text style={styles.loginLink}>Log in</Text>
        </Pressable>
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

  // ── Step indicator wrapper ─────────────────────────────────────────────────
  stepRow: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },

  // ── Body ──────────────────────────────────────────────────────────────────
  body: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    // bottom room for footer
    paddingBottom: 72,
  },

  // ── Scroll (Step 1) ────────────────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },

  // ── Heading ───────────────────────────────────────────────────────────────
  headingBlock: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headline: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size2XL,
    lineHeight: 40,
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

  // ── Primary CTA (step 1) ───────────────────────────────────────────────────
  primaryBtn: {
    width: '100%',
    minHeight: 56,
    backgroundColor: Colors.secondary,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
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

  // ── PIN view (steps 2 & 3) ─────────────────────────────────────────────────
  pinView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 280,
    rowGap: 12,
    columnGap: 0,
  },
  forgotPin: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    lineHeight: 20,
    letterSpacing: 0.4,
    color: Colors.textMuted,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },

  // ── Login footer ──────────────────────────────────────────────────────────
  loginFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.md,
    paddingTop: Spacing.md,
    backgroundColor: 'transparent',
  },
  loginPrompt: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: Colors.textMuted,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  loginLink: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: Colors.accent,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});

export default SignUpScreen;
