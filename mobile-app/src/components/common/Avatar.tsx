import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Camera, User } from 'lucide-react-native';
import { Colors, Radii } from '../../theme';

interface AvatarProps {
  uri?: string | null;
  size?: number;
  /** Shows a camera badge in the bottom-right corner when set. */
  editable?: boolean;
  onEditPress?: () => void;
}

/** Circular profile photo with an optional edit (camera) badge overlay. */
export const Avatar: React.FC<AvatarProps> = ({
  uri,
  size = 128,
  editable = false,
  onEditPress,
}) => {
  const badgeSize = Math.round(size * 0.3);

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.image} />
        ) : (
          <User size={size * 0.45} color={Colors.textMuted} strokeWidth={1.5} />
        )}
      </View>
      {editable && (
        <Pressable
          onPress={onEditPress}
          accessibilityRole="button"
          accessibilityLabel="Edit profile picture"
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              right: 0,
              bottom: 0,
            },
          ]}
        >
          <Camera size={badgeSize * 0.55} color={Colors.white} strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    backgroundColor: Colors.surface,
    borderWidth: 4,
    borderColor: Colors.white,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    backgroundColor: Colors.accent,
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default Avatar;
