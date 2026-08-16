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
import { Colors, Typography, Spacing, Radii } from '../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type PinStep = 'set' | 'confirm';

interface SetPinScreenProps {
  /** Called after PIN is successfully set and confirmed */
  onComplete?: () => void;
  /** Navigate back to sign-up screen */
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
// Success check mark component
// ─────────────────────────────────────────────────────────────────────────────
const SuccessMark: React.FC = () => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 80,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View
      style={[successStyles.circle, { transform: [{ scale: scaleAnim }] }]}
    >
      <Text style={successStyles.checkmark}>✓</Text>
    </Animated.View>
  );
};

const successStyles = StyleSheet.create({
  circle: {
    width: 80,
    height: 80,
    borderRadius: Radii.full,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  checkmark: {
    fontSize: 36,
    color: Colors.white,
    fontFamily: Typography.fontBodySemi,
    lineHeight: 42,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export const SetPinScreen: React.FC<SetPinScreenProps> = ({
  onComplete,
  onBack,
}) => {
  const [pinStep, setPinStep] = useState<PinStep>('set');
  const [pin, setPin]         = useState('');
  const [confirm, setConfirm] = useState('');
  const [pinErr, setPinErr]   = useState(false);
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
          // PIN confirmed — show success, then navigate to login
          setSuccess(true);
          setTimeout(() => onComplete?.(), 1200);
        } else {
          // Mismatch
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
    : pinStep === 'set'
      ? 'You\'ll use this to log in quickly next time.'
      : pinErr
        ? 'PINs don\'t match \u2014 try again.'
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
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            style={styles.backBtn}
          >
            <Text style={styles.backIcon}>{'\u2190'}</Text>
          </Pressable>
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
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(195, 198, 207, 0.15)',
  },
  backIcon: {
    fontSize: 22,
    color: Colors.secondary,
    fontFamily: Typography.fontBodySemi,
    lineHeight: 28,
    ...Platform.select({ android: { includeFontPadding: false } }),
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
