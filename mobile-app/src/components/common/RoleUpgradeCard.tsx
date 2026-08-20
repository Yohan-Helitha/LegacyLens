import React from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, LucideIcon } from 'lucide-react-native';
import { usePressScale } from '../../hooks/usePressScale';
import { Colors, Typography, Spacing, Radii } from '../../theme';

interface RoleUpgradeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  hint: string;
  ctaLabel?: string;
  onPress?: () => void;
}

/**
 * "Grow your role" teaser card — icon badge, title, description, italic
 * hint line, full-width CTA. No backend feature sits behind these yet, so
 * onPress is optional and safe to leave unset.
 */
export const RoleUpgradeCard: React.FC<RoleUpgradeCardProps> = ({
  icon: Icon,
  title,
  description,
  hint,
  ctaLabel = 'Get Started',
  onPress,
}) => {
  const { scale, onPressIn, onPressOut } = usePressScale();

  return (
    <View style={styles.card}>
      <View style={styles.iconBadge}>
        <Icon size={22} color={Colors.accent} strokeWidth={2} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <Text style={styles.hint}>{hint}</Text>
      <Animated.View style={{ transform: [{ scale }], width: '100%' }}>
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
          <ChevronRight size={18} color={Colors.accent} strokeWidth={2.4} />
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 260,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 207, 0.4)',
    borderRadius: Radii.xl,
    padding: Spacing.md,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    backgroundColor: Colors.secondarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    lineHeight: 22,
    color: Colors.text,
    marginBottom: 4,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  description: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    lineHeight: 20,
    color: Colors.textMuted,
    marginBottom: 6,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  hint: {
    fontFamily: Typography.fontBody,
    fontStyle: 'italic',
    fontSize: Typography.sizeXS,
    lineHeight: 16,
    color: Colors.secondary,
    opacity: 0.8,
    marginBottom: Spacing.md,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  cta: {
    minHeight: 48,
    backgroundColor: Colors.secondary,
    borderRadius: Radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.accent,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});

export default RoleUpgradeCard;
