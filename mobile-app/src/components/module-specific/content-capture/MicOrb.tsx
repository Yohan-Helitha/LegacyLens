import React from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Mic } from 'lucide-react-native';
import { usePressScale } from '../../../hooks/usePressScale';
import { ContentCaptureColors as D } from './tokens';

interface MicOrbProps {
  /** Diameter of the tappable circle */
  size?: number;
  /** true once recording has started — swaps to the "live" tone + halo ring */
  active?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

/**
 * Large circular mic button used both to start a recording and, in its
 * `active` state, to represent an in-progress recording. Shared between
 * the pre-recording prompt screen and the live recording session screen.
 */
export const MicOrb: React.FC<MicOrbProps> = ({
  size = 88,
  active = false,
  onPress,
  accessibilityLabel = 'Start recording',
}) => {
  const { scale, onPressIn, onPressOut } = usePressScale({ pressedScale: 0.94 });
  const haloSize = size + 24;

  return (
    <View style={[s.wrap, { width: haloSize, height: haloSize }]}>
      {active && (
        <View
          style={[
            s.ring,
            { width: haloSize, height: haloSize, borderRadius: haloSize / 2 },
          ]}
        />
      )}
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          style={[
            s.orb,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: active ? D.secondary : D.secondaryContainer,
            },
          ]}
        >
          <Mic
            size={Math.round(size * 0.42)}
            color={active ? '#ffffff' : D.onSecondaryContainer}
            strokeWidth={2}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(155,70,0,0.35)',
  },
  orb: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: D.secondaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
});

export default MicOrb;
