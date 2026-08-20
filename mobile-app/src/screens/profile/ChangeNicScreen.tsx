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
import { ApiError } from '../../services/api/client';
import { Colors, Typography, Spacing, Radii } from '../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface ChangeNicScreenProps {
  /** Requests the OTP (sent to the current phone) after validating the new NIC. Throw to show the error. */
  onSubmit: (newNicNumber: string) => Promise<void>;
  /** Called once the OTP has been requested successfully. */
  onComplete?: (newNicNumber: string) => void;
  onBack?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export const ChangeNicScreen: React.FC<ChangeNicScreenProps> = ({
  onSubmit,
  onComplete,
  onBack,
}) => {
  const [newNic, setNewNic] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    const trimmed = newNic.trim();
    setFormError(null);

    if (!trimmed) {
      setFieldError('New NIC number is required');
      return;
    }
    if (trimmed.length > 20) {
      setFieldError('NIC number must not exceed 20 characters');
      return;
    }
    setFieldError(null);

    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setSubmitting(false);
      onComplete?.(trimmed);
    } catch (err) {
      setSubmitting(false);
      setFormError(
        err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor={Colors.dominant} />

      <View style={styles.topBar}>
        <BackButton onPress={onBack} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headingBlock}>
            <Text style={styles.headline} accessibilityRole="header">
              Change NIC number
            </Text>
            <Text style={styles.subheadline}>
              We'll text a code to your current phone number to confirm this change.
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>New NIC number</Text>
            <View style={[styles.inputBox, !!fieldError && styles.inputBoxError]}>
              <TextInput
                style={styles.textInput}
                value={newNic}
                onChangeText={(t) => {
                  setNewNic(t);
                  if (fieldError) setFieldError(null);
                }}
                placeholder="Enter your new NIC number"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                returnKeyType="done"
                {...Platform.select({ android: { includeFontPadding: false } })}
              />
            </View>
            {!!fieldError && <Text style={styles.errorMsg}>{fieldError}</Text>}
          </View>

          {!!formError && <Text style={styles.formErrorText}>{formError}</Text>}

          <Pressable
            onPress={handleContinue}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Continue"
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
          >
            <Text style={styles.primaryBtnText}>{submitting ? 'Sending code…' : 'Continue'}</Text>
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
  topBar: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
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
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: Colors.textMuted,
    textAlign: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
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

export default ChangeNicScreen;
