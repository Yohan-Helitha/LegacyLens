import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { Typography } from '../../../theme';

/**
 * A person's real photo in a circle - or, when they have not added one, a soft circle with their first
 * initial. Never a stand-in picture of someone else.
 */
export const PersonPhoto: React.FC<{
  name?: string | null;
  source?: ImageSourcePropType | null;
  size: number;
}> = ({ name, source, size }) => {
  const circle = { width: size, height: size, borderRadius: size / 2 };

  if (source) {
    return <Image source={source} style={[s.photo, circle]} accessibilityLabel={name ? `${name} profile photo` : 'Profile photo'} />;
  }
  const initial = (name ?? '').trim().charAt(0).toUpperCase() || '?';
  return (
    <View style={[s.empty, circle]} accessibilityLabel={name ? `${name} has no profile photo yet` : 'No profile photo'}>
      <Text style={[s.initial, { fontSize: Math.max(12, Math.round(size * 0.42)) }]}>{initial}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  photo: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#a0c4c4' },
  empty: {
    backgroundColor: '#d8e8e8',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#a0c4c4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontFamily: Typography.fontBodySemi, color: '#0F5C5C' },
});

export default PersonPhoto;
