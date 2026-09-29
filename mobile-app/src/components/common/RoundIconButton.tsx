import React from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { usePressScale } from '../../hooks/usePressScale';

interface RoundIconButtonProps {
  /** Lucide icon component to render centred inside the circle */
  icon: LucideIcon;
  /** Diameter of the circular touch target */
  size?: number;
  /** Explicit icon glyph size — defaults to ~50% of `size` */
  iconSize?: number;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  onPress?: () => void;
  accessibilityLabel: string;
}

/**
 * Generic circular icon button used across module top bars and inline
 * controls (menu, filter, close, pause, …) — keeps a consistent 44px+
 * touch target and press-scale feedback wherever it's reused.
 */
export const RoundIconButton: React.FC<RoundIconButtonProps> = ({
  icon: Icon,
  size = 44,
  iconSize,
  color = '#004343',
  backgroundColor = 'transparent',
  borderColor,
  onPress,
  accessibilityLabel,
}) => {
  const { scale, onPressIn, onPressOut } = usePressScale({ pressedScale: 0.92 });

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={8}
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor,
            borderWidth: borderColor ? 1.5 : 0,
            borderColor,
          },
        ]}
      >
        <Icon size={iconSize ?? Math.round(size * 0.5)} color={color} strokeWidth={2} />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center' },
});

export default RoundIconButton;
