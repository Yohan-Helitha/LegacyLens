import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../../theme';

/**
 * Spring-scale-in checkmark circle shown after a success state
 * (PIN confirmed, OTP verified, etc).
 */
export const SuccessMark: React.FC = () => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 80,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View
      style={[styles.circle, { transform: [{ scale: scaleAnim }] }]}
    >
      <Text style={styles.checkmark}>✓</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
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

export default SuccessMark;
