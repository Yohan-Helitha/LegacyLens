import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Typography, Spacing, Radii } from '../../../theme';
import { ContentCaptureColors as D } from './tokens';

interface HireActionButtonProps {
  label: string;
  onPress?: () => void;
  /**
   * primary — deep teal fill with mango-orange text (the one main action on a screen).
   * secondary — muted outline, deliberately lighter than primary (decline / dismiss actions).
   * neutral — teal outline at the same size and weight as primary: an equally valid
   *   alternative to it (e.g. "Skip" beside "Send"), never a lesser path.
   * accent — mango-orange fill, medium emphasis (e.g. "Approve" beneath the primary action).
   * muted — quiet grey outline at the same size and weight as primary: for an equally
   *   valid choice that should simply not pull the eye (e.g. "Skip" beside "Send").
   */
  variant?: 'primary' | 'secondary' | 'neutral' | 'accent' | 'muted';
  /** 'large' (56dp) for a screen's main call-to-action; 'medium' (48dp) everywhere else. */
  size?: 'medium' | 'large';
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Shared button for the Hire a Creator screens. Every size meets the 48dp
 * minimum touch target, text wraps instead of truncating (Sinhala/Tamil
 * labels run longer than English), and the loading/disabled states are
 * announced through accessibilityState.
 */
export const HireActionButton: React.FC<HireActionButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon: Icon,
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityHint,
  style,
}) => {
  const inactive = disabled || loading;
  const isPrimary = variant === 'primary';
  const isNeutral = variant === 'neutral';
  const isAccent = variant === 'accent';
  const isMuted = variant === 'muted';
  // Everything except the deliberately-lighter secondary gets the full-weight label.
  const fullWeightLabel = variant !== 'secondary';
  const textColor = disabled
    ? D.onSurfaceVariant
    : isPrimary
      ? D.secondaryContainer
      : isAccent
        ? D.onSecondaryContainer
        : isNeutral
          ? D.primary
          : D.onSurface;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        s.base,
        size === 'large' ? s.large : s.medium,
        isPrimary ? s.primary : isAccent ? s.accent : isNeutral ? s.neutral : isMuted ? s.muted : s.secondary,
        disabled && (isPrimary || isAccent ? s.primaryDisabled : s.secondaryDisabled),
        pressed && !inactive && s.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={s.content}>
          {Icon && <Icon size={size === 'large' ? 22 : 18} color={textColor} strokeWidth={2.25} />}
          <Text
            style={[s.label, fullWeightLabel ? s.labelPrimary : s.labelSecondary, { color: textColor }]}
            maxFontSizeMultiplier={1.4}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const s = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  medium: { minHeight: 48 },
  large: { minHeight: 56, borderRadius: Radii.xl },

  primary: { backgroundColor: D.primary },
  primaryDisabled: { backgroundColor: D.surfaceVariant },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: D.outlineVariant,
  },
  secondaryDisabled: { opacity: 0.6 },
  neutral: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: D.primaryContainer,
  },
  accent: { backgroundColor: D.secondaryContainer },
  muted: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: D.outline,
  },
  pressed: { opacity: 0.88 },

  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flexShrink: 1 },
  label: { textAlign: 'center', flexShrink: 1, lineHeight: 22 },
  labelPrimary: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD },
  // Lower visual weight on purpose: regular weight, smaller, no fill.
  labelSecondary: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM },
});

export default HireActionButton;
