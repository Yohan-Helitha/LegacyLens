// src/screens/learning/CertificateScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearningStackParamList } from '../../navigation/LearningNavigator';

// Hardcoded for now — later comes from navigation params / API
const MOCK_CERTIFICATE = {
  learnerName: 'Savindu Herath',
  trackTitle: 'Southern Fishing Dialect',
  completionDate: '17 August 2026',
};

type NavigationProp = NativeStackNavigationProp<LearningStackParamList, 'Certificate'>;

export default function CertificateScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { learnerName, trackTitle, completionDate } = MOCK_CERTIFICATE;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Certificate of Completion</Text>

      <View style={styles.certificateCard}>
        <Text style={styles.emblem}>🏵️</Text>
        <Text style={styles.certTitle}>Certificate of Completion</Text>

        <Text style={styles.awardedTo}>Awarded to</Text>
        <Text style={styles.learnerName}>{learnerName}</Text>

        <Text style={styles.bodyText}>
          For successfully completing the{'\n'}
          <Text style={styles.trackName}>{trackTitle}</Text> track
        </Text>

        <Text style={styles.date}>{completionDate}</Text>

        <Text style={styles.seal}>🔶</Text>
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.actionButton}>
          <Text style={styles.actionButtonText}>⬇ Download</Text>
        </Pressable>
        <Pressable style={styles.actionButton}>
          <Text style={styles.actionButtonText}>↗ Share</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.backLink}
        onPress={() => navigation.navigate('TrackDetail', { trackId: 'track-1' })}
      >
        <Text style={styles.backLinkText}>Back to Track</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dominant, paddingTop: 50, paddingHorizontal: Spacing.lg - 4, alignItems: 'center' },
  header: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG + 2, color: Colors.text, marginBottom: Spacing.md },
  certificateCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    borderWidth: 3,
    borderColor: Colors.accent,
    paddingVertical: Spacing.xl - 8,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.lg - 4,
  },
  emblem: { fontSize: 36, marginBottom: Spacing.sm },
  certTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeLG, color: Colors.text, marginBottom: Spacing.md, textAlign: 'center' },
  awardedTo: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS + 1, color: Colors.textMuted, marginBottom: Spacing.xs },
  learnerName: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeXL - 2, color: Colors.accent, marginBottom: Spacing.sm + 2, textAlign: 'center' },
  bodyText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS + 1, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.sm + 2, lineHeight: 20 },
  trackName: { fontFamily: Typography.fontBodySemi, color: Colors.text },
  date: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: Colors.textMuted, marginBottom: Spacing.sm + 2 },
  seal: { fontSize: 24 },
  actionsRow: { flexDirection: 'row', gap: Spacing.sm + 2, width: '100%', marginBottom: Spacing.sm + 2 },
  actionButton: { flex: 1, backgroundColor: Colors.accent, borderRadius: Radii.lg + 2, paddingVertical: Spacing.sm + 6, alignItems: 'center' },
  actionButtonText: { color: Colors.white, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM },
  backLink: { paddingVertical: Spacing.xs + 2 },
  backLinkText: { color: Colors.accent, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS + 1 },
});