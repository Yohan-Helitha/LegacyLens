import React, { useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors, Typography, Spacing, Radii } from '../../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Language {
  code: string;
  label: string;
}

interface LanguageSelectionScreenProps {
  /** Called with the selected language code when the user taps Continue */
  onContinue?: (languageCode: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const LANGUAGES: Language[] = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'Sinhala / සිංහල' },
  { code: 'ta', label: 'Tamil / தமிழ்' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Radio indicator sub-component
// ─────────────────────────────────────────────────────────────────────────────
const RadioIndicator: React.FC<{ selected: boolean }> = ({ selected }) => {
  const innerScale = useRef(new Animated.Value(selected ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(innerScale, {
      toValue: selected ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View
      style={[
        styles.radioIndicator,
        selected && styles.radioIndicatorSelected,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Animated.View
        style={[styles.radioInner, { transform: [{ scale: innerScale }] }]}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Language card sub-component
// ─────────────────────────────────────────────────────────────────────────────
interface LanguageCardProps {
  language: Language;
  selected: boolean;
  onPress: () => void;
}

const LanguageCard: React.FC<LanguageCardProps> = ({
  language,
  selected,
  onPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, selected && styles.cardSelected]}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={language.label}
      >
        <Text
          style={styles.cardLabel}
          numberOfLines={1}
          ellipsizeMode="tail"
          {...Platform.select({ android: { includeFontPadding: false } })}
        >
          {language.label}
        </Text>
        <RadioIndicator selected={selected} />
      </Pressable>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export const LanguageSelectionScreen: React.FC<
  LanguageSelectionScreenProps
> = ({ onContinue }) => {
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Button press scale animation
  const btnScale = useRef(new Animated.Value(1)).current;

  const handleBtnPressIn = () => {
    if (!selectedLang) return;
    Animated.timing(btnScale, {
      toValue: 0.97,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  const handleBtnPressOut = () => {
    Animated.timing(btnScale, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  const handleContinue = () => {
    if (!selectedLang || loading) return;
    setLoading(true);
    // Simulate a brief transition delay (800 ms — matches HTML prototype)
    setTimeout(() => {
      setLoading(false);
      onContinue?.(selectedLang);
    }, 800);
  };

  const continueDisabled = !selectedLang || loading;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor={Colors.dominant} />

      {/* ── Ambient background glows ─────────────────────────────────────── */}
      <View style={[styles.glow, styles.glowTopLeft]} pointerEvents="none" />
      <View
        style={[styles.glow, styles.glowBottomRight]}
        pointerEvents="none"
      />

      {/* ── Header (suppressed nav — onboarding step) ────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          {/* Material Symbols icon approximated with a unicode glyph */}
          <Text style={styles.headerIcon}>⚖</Text>
          <Text style={styles.headerTitle}>Legacy Lens</Text>
        </View>
      </View>

      {/* ── Scrollable content area ──────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={styles.headline}
          accessibilityRole="header"
          accessible
        >
          Choose your language.
        </Text>

        {/* ── Language options ─────────────────────────────────────────── */}
        <View
          style={styles.optionsStack}
          accessibilityRole="radiogroup"
          accessible={false}
        >
          {LANGUAGES.map((lang) => (
            <LanguageCard
              key={lang.code}
              language={lang}
              selected={selectedLang === lang.code}
              onPress={() => setSelectedLang(lang.code)}
            />
          ))}
        </View>
      </ScrollView>

      {/* ── Fixed bottom action area ─────────────────────────────────────── */}
      <View style={styles.bottomArea} pointerEvents="box-none">
        <Animated.View
          style={[styles.continueWrapper, { transform: [{ scale: btnScale }] }]}
        >
          <Pressable
            onPress={handleContinue}
            onPressIn={handleBtnPressIn}
            onPressOut={handleBtnPressOut}
            disabled={continueDisabled}
            style={[
              styles.continueBtn,
              continueDisabled && styles.continueBtnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Continue"
            accessibilityState={{ disabled: continueDisabled }}
          >
            {loading ? (
              <Text style={[styles.continueBtnText, { opacity: 0.7 }]}>
                ···
              </Text>
            ) : (
              <Text style={styles.continueBtnText}>Continue</Text>
            )}
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

  // ── Ambient glows ─────────────────────────────────────────────────────────
  glow: {
    position: 'absolute',
    borderRadius: Radii.full,
  },
  glowTopLeft: {
    width: 320,
    height: 320,
    top: -80,
    left: -80,
    backgroundColor: 'rgba(15, 92, 92, 0.07)',
  },
  glowBottomRight: {
    width: 280,
    height: 280,
    bottom: -70,
    right: -70,
    backgroundColor: 'rgba(232, 121, 46, 0.06)',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    height: 64,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 22,
    color: Colors.secondary,
  },
  headerTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: 22,
    lineHeight: 28,
    color: Colors.secondary,
    letterSpacing: -0.4,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    // Extra bottom padding so the last card clears the fixed button
    paddingBottom: 120,
  },

  // ── Headline ──────────────────────────────────────────────────────────────
  headline: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size2XL,
    lineHeight: 40,
    color: Colors.secondary,
    letterSpacing: -0.5,
    marginBottom: Spacing.xl,
    textAlign: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },

  // ── Options stack ─────────────────────────────────────────────────────────
  optionsStack: {
    gap: 16,
  },

  // ── Language card ─────────────────────────────────────────────────────────
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: 'rgba(195, 198, 207, 0.8)', // outline-variant
    borderRadius: Radii.lg,
    // Subtle card shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  cardSelected: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(232, 121, 46, 0.05)',
  },
  cardLabel: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXL,
    lineHeight: 32,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.md,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },

  // ── Radio indicator ───────────────────────────────────────────────────────
  radioIndicator: {
    width: 24,
    height: 24,
    borderRadius: Radii.full,
    borderWidth: 2,
    borderColor: '#73777f', // outline token
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioIndicatorSelected: {
    borderColor: Colors.accent,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: Radii.full,
    backgroundColor: Colors.accent,
  },

  // ── Bottom action area ────────────────────────────────────────────────────
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.md,
    paddingTop: Spacing.lg,
    backgroundColor: 'transparent',
  },
  continueWrapper: {
    width: '100%',
  },
  continueBtn: {
    width: '100%',
    minHeight: 56,
    backgroundColor: Colors.secondary,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnDisabled: {
    backgroundColor: '#c3c6cf',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    letterSpacing: 0.5,
    color: Colors.white,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});

export default LanguageSelectionScreen;
