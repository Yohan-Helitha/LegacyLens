import React from 'react';
import { Image, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ResizeMode, Video } from 'expo-av';
import { Typography, Spacing, Radii } from '../../../theme';
import { resolveImageUrl } from '../../../constants/api';
import type { WorkMaterialResponse } from '../../../types/workProgress';

const IMAGE = /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i;
const VIDEO = /\.(mp4|mov|m4v|webm|3gp|mkv)$/i;

/**
 * Opens one collected material full screen: a photo is shown whole, a video plays with the usual
 * controls, and any other file is handed to the phone to open. Closing returns to the card.
 */
export const MaterialViewer: React.FC<{ material: WorkMaterialResponse | null; onClose: () => void }> = ({ material, onClose }) => {
  if (!material) return null;
  const uri = resolveImageUrl(material.fileUrl);
  const isImage = IMAGE.test(material.fileName) || IMAGE.test(material.fileUrl);
  const isVideo = VIDEO.test(material.fileName) || VIDEO.test(material.fileUrl);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.backdrop}>
        <View style={s.header}>
          <Text style={s.name} numberOfLines={1}>{material.fileName}</Text>
          <Pressable onPress={onClose} style={({ pressed }) => [s.closeBtn, pressed && s.pressed]} accessibilityRole="button" accessibilityLabel="Close">
            <Text style={s.closeText}>Close ✕</Text>
          </Pressable>
        </View>

        <View style={s.stage}>
          {!uri ? (
            <Text style={s.note}>This file cannot be opened.</Text>
          ) : isImage ? (
            <Image source={{ uri }} style={s.media} resizeMode="contain" accessibilityLabel={material.fileName} />
          ) : isVideo ? (
            <Video source={{ uri }} style={s.media} useNativeControls shouldPlay resizeMode={ResizeMode.CONTAIN} />
          ) : (
            <Pressable onPress={() => Linking.openURL(uri)} style={({ pressed }) => [s.openBtn, pressed && s.pressed]} accessibilityRole="button">
              <Text style={s.openBtnText}>Open file</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', paddingTop: 48, paddingBottom: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, gap: Spacing.sm },
  name: { flex: 1, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ffffff' },
  closeBtn: { minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: Radii.full, backgroundColor: 'rgba(255,255,255,0.16)' },
  closeText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ffffff' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  media: { width: '100%', height: '100%' },
  note: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, color: '#ffffff' },
  openBtn: { minHeight: 48, paddingHorizontal: 28, justifyContent: 'center', borderRadius: Radii.full, backgroundColor: '#E8792E' },
  openBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: '#ffffff' },
  pressed: { opacity: 0.75 },
});
