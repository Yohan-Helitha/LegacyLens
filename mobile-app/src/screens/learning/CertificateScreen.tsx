// src/screens/learning/CertificateScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

// Hardcoded for now — later comes from navigation params / API
const MOCK_CERTIFICATE = {
  learnerName: 'Savindu Herath',
  trackTitle: 'Southern Fishing Dialect',
  completionDate: '17 August 2026',
};

export default function CertificateScreen() {
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

      <Pressable style={styles.backLink}>
        <Text style={styles.backLinkText}>Back to Track</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6EC', paddingTop: 50, paddingHorizontal: 20, alignItems: 'center' },
  header: { fontSize: 20, fontWeight: '700', color: '#3E2723', marginBottom: 20 },
  certificateCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#C9782E',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  emblem: { fontSize: 36, marginBottom: 10 },
  certTitle: { fontSize: 18, fontWeight: '800', color: '#3E2723', marginBottom: 20, textAlign: 'center' },
  awardedTo: { fontSize: 12, color: '#6D4C41', marginBottom: 4 },
  learnerName: { fontSize: 22, fontWeight: '800', color: '#C9782E', marginBottom: 16, textAlign: 'center' },
  bodyText: { fontSize: 13, color: '#6D4C41', textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  trackName: { fontWeight: '700', color: '#3E2723' },
  date: { fontSize: 12, color: '#9B8D7D', marginBottom: 16 },
  seal: { fontSize: 24 },
  actionsRow: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 16 },
  actionButton: {
    flex: 1,
    backgroundColor: '#C9782E',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  backLink: { paddingVertical: 8 },
  backLinkText: { color: '#C9782E', fontWeight: '700', fontSize: 13 },
});