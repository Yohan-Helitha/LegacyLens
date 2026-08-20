import { useRef } from 'react';
import { Animated } from 'react-native';

interface UsePressScaleOptions {
  pressedScale?: number;
  pressInDuration?: number;
  pressOutDuration?: number;
}

/**
 * Shared press-feedback animation: scales a view down on press-in and
 * springs it back on press-out. Spread the returned handlers onto a
 * `Pressable` and apply `{ transform: [{ scale }] }` to its wrapping
 * `Animated.View`.
 */
export function usePressScale({
  pressedScale = 0.97,
  pressInDuration = 80,
  pressOutDuration = 120,
}: UsePressScaleOptions = {}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.timing(scale, {
      toValue: pressedScale,
      duration: pressInDuration,
      useNativeDriver: true,
    }).start();

  const onPressOut = () =>
    Animated.timing(scale, {
      toValue: 1,
      duration: pressOutDuration,
      useNativeDriver: true,
    }).start();

  return { scale, onPressIn, onPressOut };
}
