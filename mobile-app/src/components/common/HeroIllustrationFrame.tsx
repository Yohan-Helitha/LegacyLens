import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors, Radii } from '../../theme';

export interface HeroBadgeSpec {
  icon: React.ReactNode;
  corner: 'topRight' | 'bottomLeft' | 'bottomRight' | 'topLeft';
  /** Background tint — defaults to the accent orange */
  tint?: 'teal' | 'orange';
}

interface HeroIllustrationFrameProps {
  size: number;
  marginBottom?: number;
  /** Animated.Value driving a continuous vertical float, if any */
  floatOffset?: Animated.Value;
  badges?: HeroBadgeSpec[];
  /** The screen-specific SVG illustration */
  children: React.ReactNode;
}

const CORNER_STYLE = {
  topRight: { top: 2, right: 2 },
  bottomLeft: { bottom: -6, left: 12 },
  bottomRight: { bottom: -6, right: 12 },
  topLeft: { top: 2, left: 12 },
} as const;

/**
 * Circular halo-and-badge frame used to present each onboarding screen's
 * hero illustration — soft glow halos behind a white icon circle, with
 * small accent badges pinned to its corners.
 */
export const HeroIllustrationFrame: React.FC<HeroIllustrationFrameProps> = ({
  size,
  marginBottom = 0,
  floatOffset,
  badges = [],
  children,
}) => (
  <Animated.View
    style={[
      styles.wrap,
      {
        width: size,
        height: size,
        marginBottom,
        transform: floatOffset ? [{ translateY: floatOffset }] : undefined,
      },
    ]}
  >
    <View style={[styles.haloOuter, { width: size + 48, height: size + 48 }]} />
    <View style={[styles.halo, { width: size + 24, height: size + 24 }]} />

    <View style={[styles.iconCircle, { width: size, height: size }]}>
      {children}
    </View>

    {badges.map((badge, i) => (
      <View
        key={i}
        style={[
          styles.badge,
          CORNER_STYLE[badge.corner],
          { backgroundColor: badge.tint === 'teal' ? Colors.secondary : Colors.accent },
        ]}
      >
        {badge.icon}
      </View>
    ))}
  </Animated.View>
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  haloOuter: {
    position: 'absolute',
    borderRadius: Radii.full,
    backgroundColor: 'rgba(15, 92, 92, 0.03)',
  },
  halo: {
    position: 'absolute',
    borderRadius: Radii.full,
    backgroundColor: 'rgba(15, 92, 92, 0.06)',
  },
  iconCircle: {
    borderRadius: Radii.full,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: 'rgba(232, 226, 210, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 5,
  },
  badge: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 4,
  },
});

export default HeroIllustrationFrame;
