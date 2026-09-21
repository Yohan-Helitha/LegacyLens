import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Typography } from '../../../theme';
import { ContentCaptureColors as D } from './tokens';

interface TrustProgressRingProps {
  level: number;
  /** 0–1 fill fraction toward the next level (1 once the highest level is reached). */
  progress: number;
  size?: number;
}

/**
 * Large circular progress badge — a mango-orange arc filling over a teal
 * track, with the current level prominent in the center (Screen 7, Trust
 * Score Detail).
 */
export const TrustProgressRing: React.FC<TrustProgressRingProps> = ({
  level,
  progress,
  size = 176,
}) => {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const dashOffset = circumference * (1 - clamped);

  return (
    <View style={[s.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={D.primaryContainer}
          strokeOpacity={0.25}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={D.secondaryContainer}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          fill="none"
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={s.centerLabel} pointerEvents="none">
        <Text style={s.levelCaption}>LEVEL</Text>
        <Text style={s.levelNumber}>{level}</Text>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  centerLabel: { position: 'absolute', alignItems: 'center' },
  levelCaption: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeXS,
    letterSpacing: 1.5,
    color: D.onSurfaceVariant,
    marginBottom: 2,
  },
  levelNumber: {
    fontFamily: Typography.fontDisplay,
    fontSize: 48,
    color: D.primary,
  },
});

export default TrustProgressRing;
