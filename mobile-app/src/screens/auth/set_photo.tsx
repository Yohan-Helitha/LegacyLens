import React, { useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { BackButton, GhostButton } from '../../components/common';
import { usePressScale } from '../../hooks/usePressScale';
import { Colors, Typography, Spacing, Radii } from '../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface SetPhotoScreenProps {
  /** Navigate to the set-PIN screen after photo is uploaded or skipped */
  onContinue?: () => void;
  /** Navigate back to the sign-up screen */
  onBack?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Person icon (SVG-based, no external dependency needed)
// Uses a simple emoji / unicode person silhouette rendered as text
// ─────────────────────────────────────────────────────────────────────────────
const PersonPlaceholder: React.FC = () => (
  <Text style={placeholderStyles.icon} accessibilityLabel="No photo selected">
    {'\uD83D\uDC64'}
  </Text>
);

const placeholderStyles = StyleSheet.create({
  icon: {
    fontSize: 72,
    lineHeight: 90,
    opacity: 0.4,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Camera badge
// ─────────────────────────────────────────────────────────────────────────────
const CameraBadge: React.FC<{ hasPhoto: boolean }> = ({ hasPhoto }) => (
  <View style={[badgeStyles.badge, hasPhoto && badgeStyles.badgeActive]}>
    <Text style={badgeStyles.icon}>📷</Text>
  </View>
);

const badgeStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    backgroundColor: Colors.accent,        // secondary-container / accent
    borderWidth: 3,
    borderColor: Colors.dominant,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeActive: {
    backgroundColor: Colors.secondary,
  },
  icon: {
    fontSize: 18,
    lineHeight: 22,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export const SetPhotoScreen: React.FC<SetPhotoScreenProps> = ({
  onContinue,
  onBack,
}) => {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Animations
  const avatarScale = useRef(new Animated.Value(1)).current;
  const slideAnim   = useRef(new Animated.Value(0)).current;
  const uploadPress = usePressScale();

  React.useEffect(() => {
    // Entrance slide-up
    slideAnim.setValue(40);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  // ── Avatar press animation ────────────────────────────────────────────────
  const pressAvatarIn = () =>
    Animated.timing(avatarScale, {
      toValue: 0.96,
      duration: 100,
      useNativeDriver: true,
    }).start();

  const pressAvatarOut = () =>
    Animated.timing(avatarScale, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();

  // ── Request permissions helper ────────────────────────────────────────────
  const requestPermission = async (
    type: 'library' | 'camera',
  ): Promise<boolean> => {
    if (type === 'library') {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Legacy Lens needs access to your photo library to set a profile picture. Please enable it in Settings.',
          [{ text: 'OK' }],
        );
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Legacy Lens needs camera access to take a profile photo. Please enable it in Settings.',
          [{ text: 'OK' }],
        );
        return false;
      }
    }
    return true;
  };

  // ── Launch image picker (library or camera) ───────────────────────────────
  const openPicker = async (source: 'library' | 'camera') => {
    const granted = await requestPermission(source);
    if (!granted) return;

    setUploading(true);
    try {
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.85,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.85,
            });

      if (!result.canceled && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
        // Photo selected — user can still press "Upload Photo" to confirm
        // or navigate forward; auto-continue after selection:
        setTimeout(() => onContinue?.(), 300);
      }
    } finally {
      setUploading(false);
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleUpload = () => {
    if (Platform.OS === 'ios') {
      // Native iOS action sheet
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) openPicker('camera');
          if (buttonIndex === 2) openPicker('library');
        },
      );
    } else {
      // Android — simple Alert as action sheet
      Alert.alert(
        'Profile photo',
        'Choose a source',
        [
          { text: 'Take Photo',          onPress: () => openPicker('camera')  },
          { text: 'Choose from Library', onPress: () => openPicker('library') },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true },
      );
    }
  };

  const handleSkip = () => {
    onContinue?.();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor={Colors.dominant} />

      {/* ── Ambient glows ──────────────────────────────────────────────────── */}
      <View style={[styles.glow, styles.glowTopLeft]}  pointerEvents="none" />
      <View style={[styles.glow, styles.glowBottomRight]} pointerEvents="none" />

      {/* ── Back button ────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <BackButton onPress={onBack} />
      </View>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.container,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* ── Avatar ───────────────────────────────────────────────────────── */}
        <Pressable
          onPress={handleUpload}
          onPressIn={pressAvatarIn}
          onPressOut={pressAvatarOut}
          accessibilityRole="button"
          accessibilityLabel="Choose profile photo"
          style={styles.avatarWrapper}
        >
          <Animated.View
            style={[
              styles.avatarRing,
              { transform: [{ scale: avatarScale }] },
            ]}
          >
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={styles.avatarImage}
                accessibilityLabel="Profile photo"
              />
            ) : (
              <PersonPlaceholder />
            )}
          </Animated.View>

          {/* Camera badge */}
          <CameraBadge hasPhoto={!!photoUri} />
        </Pressable>

        {/* ── Heading ──────────────────────────────────────────────────────── */}
        <View style={styles.headingBlock}>
          <Text style={styles.headline} accessibilityRole="header">
            Add a profile photo
          </Text>
          <Text style={styles.subheadline}>
            Helps others recognise you — this is optional.
          </Text>
        </View>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <View style={styles.actions}>
          {/* Upload Photo */}
          <Animated.View
            style={{ transform: [{ scale: uploadPress.scale }], width: '100%' }}
          >
            <Pressable
              onPress={handleUpload}
              accessibilityRole="button"
              accessibilityLabel="Upload photo"
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.primaryBtnPressed,
              ]}
              onPressIn={uploadPress.onPressIn}
              onPressOut={uploadPress.onPressOut}
            >
              {uploading ? (
                <Text style={styles.primaryBtnText}>Uploading…</Text>
              ) : (
                <Text style={styles.primaryBtnText}>
                  {photoUri ? 'Change Photo' : 'Upload Photo'}
                </Text>
              )}
            </Pressable>
          </Animated.View>

          {/* Skip */}
          <GhostButton label="Skip" onPress={handleSkip} accessibilityLabel="Skip for now" />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.dominant,
  },

  // ── Ambient glows ──────────────────────────────────────────────────────────
  glow: {
    position: 'absolute',
    borderRadius: Radii.full,
  },
  glowTopLeft: {
    width: 320,
    height: 320,
    top: -90,
    left: -90,
    backgroundColor: 'rgba(15, 92, 92, 0.07)',
  },
  glowBottomRight: {
    width: 280,
    height: 280,
    bottom: -70,
    right: -70,
    backgroundColor: 'rgba(232, 121, 46, 0.06)',
  },

  // ── Top bar ────────────────────────────────────────────────────────────────
  topBar: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },

  // ── Main content ───────────────────────────────────────────────────────────
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },

  // ── Avatar ─────────────────────────────────────────────────────────────────
  avatarWrapper: {
    marginBottom: Spacing.xl * 1.5,
    position: 'relative',
    alignSelf: 'center',
  },
  avatarRing: {
    width: 160,
    height: 160,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 207, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: 'rgba(27, 58, 92, 0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarImage: {
    width: 160,
    height: 160,
    borderRadius: Radii.full,
  },

  // ── Heading ────────────────────────────────────────────────────────────────
  headingBlock: {
    alignItems: 'center',
    marginBottom: Spacing.xl * 2,
    paddingHorizontal: Spacing.md,
    maxWidth: 340,
  },
  headline: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size2XL,
    lineHeight: 40,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  subheadline: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeLG,
    lineHeight: 28,
    color: Colors.textMuted,
    textAlign: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },

  // ── Action buttons ─────────────────────────────────────────────────────────
  actions: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },

  // Primary — "Upload Photo"
  primaryBtn: {
    width: '100%',
    minHeight: 56,
    backgroundColor: Colors.secondary,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.1,
  },
  primaryBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    letterSpacing: 0.5,
    color: Colors.white,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});

export default SetPhotoScreen;
