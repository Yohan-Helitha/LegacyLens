import React from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text } from 'react-native';
import { usePressScale } from '../../hooks/usePressScale';
import { Colors, Typography, Radii } from '../../theme';

interface GhostButtonProps {
  label: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
}

/**
 * Full-width, transparent secondary action button (e.g. "Skip") — pairs
 * below a solid primary CTA.
 */
export const GhostButton: React.FC<GhostButtonProps> = ({
  label,
  onPress,
  accessibilityLabel,
  disabled,
}) => {
  const { scale, onPressIn, onPressOut } = usePressScale();

  return (
    <Animated.View style={{ transform: [{ scale }], width: '100%' }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.text}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: 56,
    backgroundColor: 'transparent',
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: Colors.surface,
  },
  text: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    letterSpacing: 0.5,
    color: Colors.secondary,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});

export default GhostButton;
