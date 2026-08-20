import React from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { usePressScale } from '../../hooks/usePressScale';
import { Colors, Radii } from '../../theme';

interface BackButtonProps {
  onPress?: () => void;
  /** Screen-reader label — defaults to "Go back" */
  accessibilityLabel?: string;
}

const SIZE = 48;

/**
 * Circular back-navigation button. Rendered as a solid, shadowed white
 * surface with a crisp vector arrow so it reads clearly as tappable
 * against any background, rather than a faint glyph that can disappear
 * visually — a 48px touch target also clears the recommended minimum.
 */
export const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  accessibilityLabel = 'Go back',
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
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <ArrowLeft size={22} color={Colors.secondary} strokeWidth={2.4} />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  buttonPressed: {
    backgroundColor: Colors.surface,
  },
});

export default BackButton;
