import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { getMediaUrl } from '../../constants/api';

export interface AvatarPlaceholderProps {
  name?: string;
  avatarUrl?: string | null;
  size?: number;
  theme?: 'dark' | 'light' | 'teal';
  style?: StyleProp<ViewStyle>;
  borderColor?: string;
  borderWidth?: number;
}

/**
 * Checks if the given URL is a real user/database uploaded image
 * and not a hardcoded placeholder/stock image.
 */
function isRealAvatarUri(uri?: string | null): boolean {
  if (!uri || typeof uri !== 'string') return false;
  const trimmed = uri.trim();
  if (!trimmed) return false;
  // Ignore known stock/mock services so they show clean placeholders instead
  if (
    trimmed.includes('unsplash.com') ||
    trimmed.includes('pravatar.cc') ||
    trimmed.includes('aida-public')
  ) {
    return false;
  }
  return true;
}

function resolveAvatarUri(raw?: string | null): string | null {
  if (!raw || !isRealAvatarUri(raw)) return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const normalizedPath = trimmed.startsWith('/uploads/')
    ? trimmed
    : trimmed.startsWith('uploads/')
    ? `/${trimmed}`
    : `/uploads/${trimmed.replace(/^\/+/, '')}`;
  return getMediaUrl(normalizedPath);
}

function getInitials(name?: string): string {
  if (!name) return '';
  // Clean out parens like "(Community Learner)"
  const clean = name.replace(/\([^)]*\)/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const AvatarPlaceholder: React.FC<AvatarPlaceholderProps> = ({
  name,
  avatarUrl,
  size = 36,
  theme = 'light',
  style,
  borderColor,
  borderWidth,
}) => {
  const [hasError, setHasError] = useState(false);
  const resolvedUri = resolveAvatarUri(avatarUrl);

  const isDark = theme === 'dark';
  const isTeal = theme === 'teal';

  const backgroundColor = isTeal
    ? '#0f5c5c'
    : isDark
    ? 'rgba(172, 238, 238, 0.22)'
    : '#E4ECEB';

  const textColor = isTeal ? '#FFFFFF' : isDark ? '#ACEEEE' : '#0f5c5c';

  const initials = getInitials(name);

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...(borderWidth ? { borderWidth, borderColor: borderColor || textColor } : {}),
  };

  if (resolvedUri && !hasError) {
    return (
      <View style={[containerStyle, style]}>
        <Image
          source={{ uri: resolvedUri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          onError={() => setHasError(true)}
        />
      </View>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      {initials ? (
        <Text
          style={[
            styles.initials,
            {
              fontSize: Math.max(10, Math.round(size * 0.38)),
              color: textColor,
            },
          ]}
          numberOfLines={1}
        >
          {initials}
        </Text>
      ) : (
        <MaterialIcons
          name="person"
          size={Math.round(size * 0.58)}
          color={textColor}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  initials: {
    fontWeight: '700',
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlign: 'center',
  },
});

export default AvatarPlaceholder;
