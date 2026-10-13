import React, { useState } from 'react';
import { ActivityIndicator, Image, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMediaUrl } from '../../../constants/api';
import { creatorProfileApi } from '../../../services/api/creatorProfileApi';
import { Typography, Spacing, Radii } from '../../../theme';
import type { CreatorApplicationStatus } from '../../../types/creatorProfile';

const C = {
  primary: '#0F5C5C',
  secondary: '#E8792E',
  surface: '#ffffff',
  onSurface: '#202428',
  onSurfaceVariant: '#4a5568',
  divider: '#c8dcdc',
  danger: '#C0392B',
} as const;

const STATUS_LABEL: Record<CreatorApplicationStatus, string> = {
  PENDING: 'Waiting for review',
  VERIFIED: 'Verified',
  REJECTED: 'Needs to be resubmitted',
};

/**
 * The creator's saved verification document. Only the owner ever sees this
 * card (the backend sends the details to no one else). The file is private, so
 * tapping "View" first asks the server for a short-lived link: images open
 * here in a full-screen viewer, anything else (a PDF) opens in the phone's own
 * viewer.
 */
export const ProofDocumentCard: React.FC<{
  status: CreatorApplicationStatus | null;
  proofUploaded: boolean;
  contentType: string | null;
}> = ({ status, proofUploaded, contentType }) => {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const open = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const link = await creatorProfileApi.createProofLink();
      const url = getMediaUrl(link.path);
      if (link.contentType.startsWith('image/')) {
        setImageUri(url);
      } else {
        await Linking.openURL(url);
      }
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.card}>
      <Text style={s.title}>Verification</Text>
      <Text style={s.privacy}>Only you can see this.</Text>

      {status && (
        <View style={s.row}>
          <Text style={s.label}>Status</Text>
          <Text style={s.value}>{STATUS_LABEL[status]}</Text>
        </View>
      )}

      <View style={[s.row, s.rowLast]}>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>Proof document</Text>
          <Text style={s.value}>
            {proofUploaded ? (contentType === 'application/pdf' ? 'PDF uploaded' : 'Photo uploaded') : 'Nothing uploaded'}
          </Text>
        </View>
        {proofUploaded && (
          <Pressable
            onPress={open}
            disabled={busy}
            style={({ pressed }) => [s.viewBtn, pressed && s.pressed]}
            accessibilityRole="button"
            accessibilityLabel="View proof document"
          >
            {busy ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={s.viewBtnText}>View</Text>}
          </Pressable>
        )}
      </View>

      {failed && <Text style={s.error}>Couldn't open the document. Please try again.</Text>}

      <Modal visible={imageUri != null} animationType="fade" onRequestClose={() => setImageUri(null)}>
        <SafeAreaView style={s.viewer}>
          <Pressable
            onPress={() => setImageUri(null)}
            style={s.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close document"
          >
            <Text style={s.closeText}>Close</Text>
          </Pressable>
          {imageUri && <Image source={{ uri: imageUri }} style={s.viewerImage} resizeMode="contain" />}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  title: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: C.primary },
  privacy: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: C.onSurfaceVariant, marginBottom: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.divider,
  },
  rowLast: { borderBottomWidth: 0 },
  label: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: C.onSurface },
  value: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: C.onSurfaceVariant, marginTop: 2 },
  viewBtn: {
    minWidth: 72,
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: Radii.full,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ffffff' },
  pressed: { opacity: 0.8 },
  error: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: C.danger, marginTop: 6 },
  viewer: { flex: 1, backgroundColor: '#000000' },
  closeBtn: { alignSelf: 'flex-end', padding: Spacing.md },
  closeText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: '#ffffff' },
  viewerImage: { flex: 1, width: '100%' },
});

export default ProofDocumentCard;
