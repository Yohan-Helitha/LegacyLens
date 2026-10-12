import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, X } from 'lucide-react-native';
import { Typography, Spacing, Radii } from '../../../theme';
import { ContentCaptureColors as D } from './tokens';

interface ThumbnailPickerProps {
  uri: string | undefined;
  onChange: (uri: string | undefined) => void;
  editable?: boolean;
}

/**
 * Optional thumbnail image — never required, so the empty state is styled
 * to look intentional (a dashed "Add thumbnail" affordance), not like a
 * missing field.
 *
 * Local-only today: there is no `thumbnail_url` column or field anywhere in
 * the backend's Story entity/StoryResponse/CreateStoryRequest, so a picked
 * image lives only in the draft and is never actually uploaded or
 * persisted. (The admin-side ModerationQueueItem entity does have an
 * imageUrl column, for a *different* purpose — an admin adding a thumbnail
 * after approval — but nothing wires an elder-picked image to it.) Wiring
 * this up for real needs a backend field addition first.
 */
export const ThumbnailPicker: React.FC<ThumbnailPickerProps> = ({ uri, onChange, editable = true }) => {
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      onChange(result.assets[0].uri);
    }
  };

  if (uri) {
    return (
      <View style={s.filledWrap}>
        <Image source={{ uri }} style={s.image} accessibilityLabel="Selected thumbnail" />
        {editable && (
          <Pressable
            onPress={() => onChange(undefined)}
            style={({ pressed }) => [s.removeBtn, pressed && s.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Remove thumbnail"
            hitSlop={8}
          >
            <X size={16} color="#ffffff" strokeWidth={2.5} />
          </Pressable>
        )}
      </View>
    );
  }

  if (!editable) {
    return null;
  }

  return (
    <Pressable
      onPress={pickImage}
      style={({ pressed }) => [s.emptyWrap, pressed && s.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Add thumbnail, optional"
    >
      <ImagePlus size={26} color={D.onSurfaceVariant} strokeWidth={2} />
      <Text style={s.emptyText}>Add thumbnail</Text>
      <Text style={s.emptyHint}>Optional</Text>
    </Pressable>
  );
};

const s = StyleSheet.create({
  emptyWrap: {
    width: 140,
    height: 90,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    borderStyle: 'dashed',
    backgroundColor: D.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  emptyText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },
  emptyHint: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: D.onSurfaceVariant, opacity: 0.75 },

  filledWrap: { width: 140, height: 90, borderRadius: Radii.lg, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pressed: { opacity: 0.85 },
});

export default ThumbnailPicker;
