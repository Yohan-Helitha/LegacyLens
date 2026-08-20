import React, { useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BackButton, SuccessMark } from '../../components/common';
import { ApiError } from '../../services/api/client';
import { Colors, Typography, Spacing, Radii } from '../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type PinStep = 'set' | 'confirm';

interface SetPinScreenProps {
  /**
   * Called once the user has entered and confirmed a matching PIN — should
   * perform the actual backend call (register, or reset-pin) and resolve on
   * success. Throwing surfaces the error message on the confirm step and
   * lets the user retry.
   */
  onSubmit: (pin: string) => Promise<void>;
  /** Called after a successful submit, once the success animation finishes */
  onComplete?: () => void;
  /** Navigate back */
  onBack?: () => void;
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
// PIN dot indicator
// ─────────────────────────────────────────────────────────────────────────────
const PinDots: React.FC<{ filled: number; error?: boolean }> = ({
  filled,
  error,
}) => (
  <View
    style={pinStyles.row}
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
  row: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: Radii.full,
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  dotFilled: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    transform: [{ scale: 1.1 }],
  },
  dotEmpty: {
    backgroundColor: 'transparent',
  },
  dotError: {
    backgroundColor: '#ba1a1a',
    borderColor: '#ba1a1a',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Numpad key
// ─────────────────────────────────────────────────────────────────────────────
const NumKey: React.FC<{ label: string; onPress: () => void }> = ({
  label,
  onPress,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.timing(scale, {
      toValue: 0.88,
      duration: 80,
      useNativeDriver: true,
    }).start();

  const pressOut = () =>
    Animated.timing(scale, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();

  if (label === '') return <View style={numStyles.key} />;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={({ pressed }) => [
          numStyles.key,
          pressed && numStyles.keyPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={label === '⌫' ? 'Backspace' : label}
        hitSlop={8}
      >
        {label === '⌫' ? (
          <Text style={numStyles.backspace}>{label}</Text>
        ) : (
          <Text style={numStyles.digit}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

const numStyles = StyleSheet.create({
  key: {
    width: 72,
    height: 72,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    backgroundColor: '#e8e2d2',
    shadowColor: 'rgba(232, 226, 210, 1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 1,
  },
  keyPressed: {
    backgroundColor: '#dde3ef',
    transform: [{ scale: 0.92 }],
  },
  digit: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size2XL,
    lineHeight: 36,
    color: Colors.secondary,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  backspace: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 24,
    color: Colors.secondary,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export const SetPinScreen: React.FC<SetPinScreenProps> = ({
  onSubmit,
  onComplete,
  onBack,
}) => {
  const [pinStep, setPinStep] = useState<PinStep>('set');
  const [pin, setPin]         = useState('');
  const [confirm, setConfirm] = useState('');
  const [pinErr, setPinErr]   = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Animations
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(1)).current;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 7,   duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -7,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 40, useNativeDriver: true }),
    ]).start();
  };

  const transitionTo = (next: PinStep) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setPinStep(next);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 70,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // ── Numpad handlers ────────────────────────────────────────────────────────
  const handleSetKey = (key: string) => {
    if (key === '⌫') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + key;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      setTimeout(() => transitionTo('confirm'), 300);
    }
  };

  const handleConfirmKey = (key: string) => {
    if (submitting) return;
    if (key === '⌫') {
      setConfirm((c) => c.slice(0, -1));
      setPinErr(false);
      return;
    }
    if (confirm.length >= PIN_LENGTH) return;
    const next = confirm + key;
    setConfirm(next);
    if (next.length === PIN_LENGTH) {
      setTimeout(async () => {
        if (next !== pin) {
          setPinErr(true);
          setErrorMessage(null);
          triggerShake();
          setTimeout(() => {
            setConfirm('');
            setPinErr(false);
          }, 700);
          return;
        }

        setSubmitting(true);
        try {
          await onSubmit(next);
          setSubmitting(false);
          setSuccess(true);
          setTimeout(() => onComplete?.(), 1200);
        } catch (err) {
          setSubmitting(false);
          setPinErr(true);
          setErrorMessage(
            err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
          );
          triggerShake();
          setTimeout(() => {
            setConfirm('');
            setPinErr(false);
          }, 900);
        }
      }, 200);
    }
  };

  const handleBack = () => {
    if (pinStep === 'confirm') {
      setConfirm('');
      setPinErr(false);
      transitionTo('set');
    } else {
      onBack?.();
    }
  };

  // ── Dynamic copy ───────────────────────────────────────────────────────────
  const heading = success
    ? 'PIN set!'
    : pinStep === 'set'
      ? 'Create a 4-digit PIN'
      : 'Confirm your PIN';

  const subheading = success
    ? 'You\'re all set. Taking you to login\u2026'
    : submitting
      ? 'Just a moment\u2026'
      : pinStep === 'set'
        ? 'You\'ll use this to log in quickly next time.'
        : pinErr
          ? (errorMessage ?? 'PINs don\'t match \u2014 try again.')
          : 'Enter your PIN again to confirm.';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor={Colors.dominant} />

      {/* ── Ambient glows ──────────────────────────────────────────────────── */}
      <View style={[styles.glow, styles.glowTopLeft]}  pointerEvents="none" />
      <View style={[styles.glow, styles.glowBottomRight]} pointerEvents="none" />

      {/* ── Back button ────────────────────────────────────────────────────── */}
      {!success && (
        <View style={styles.topBar}>
          <BackButton onPress={handleBack} />
        </View>
      )}

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.contentWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Heading */}
          <View style={styles.headingBlock}>
            {success && <SuccessMark />}
            <Text style={styles.headline} accessibilityRole="header">
              {heading}
            </Text>
            <Text style={[styles.subheadline, pinErr && styles.subheadlineError]}>
              {subheading}
            </Text>
          </View>

          {/* PIN dots */}
          {!success && (
            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
              <PinDots
                filled={pinStep === 'set' ? pin.length : confirm.length}
                error={pinErr}
              />
            </Animated.View>
          )}

          {/* Numpad */}
          {!success && (
            <View style={styles.numPad}>
              {NUM_PAD_KEYS.map((key, idx) => (
                <NumKey
                  key={idx}
                  label={key}
                  onPress={() =>
                    pinStep === 'set' ? handleSetKey(key) : handleConfirmKey(key)
                  }
                />
              ))}
            </View>
          )}

          {/* Change PIN link — confirm step only */}
          {!success && pinStep === 'confirm' && (
            <Pressable
              onPress={() => {
                setPin('');
                setConfirm('');
                setPinErr(false);
                transitionTo('set');
              }}
              accessibilityRole="button"
              accessibilityLabel="Change PIN"
              hitSlop={8}
              style={{ marginTop: Spacing.md }}
            >
              <Text style={styles.changePin}>Change PIN</Text>
            </Pressable>
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

  // ── Numpad ─────────────────────────────────────────────────────────────────
  numPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 300,
    rowGap: 16,
    columnGap: 0,
  },

  // ── Change PIN link ────────────────────────────────────────────────────────
  changePin: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    lineHeight: 20,
    letterSpacing: 0.4,
    color: Colors.textMuted,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});

export default SetPinScreen;
