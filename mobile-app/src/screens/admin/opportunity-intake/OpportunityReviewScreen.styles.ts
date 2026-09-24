import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../../../theme';

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#eaf2f2' },
  header: {
    height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md
  },
  iconBtn: { padding: 8 },
  headerTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeLG, fontWeight: '600', color: Colors.secondary },
  
  scrollContent: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: Spacing.md },

  playerCard: {
    backgroundColor: '#f2f4f3', borderRadius: Radii.xl, padding: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.4)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  personName: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeMD, fontWeight: '600', color: Colors.text, marginBottom: Spacing.md },
  
  waveformContainer: { marginBottom: Spacing.md },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  timeTextActive: { fontFamily: Typography.fontBodyMed, fontSize: 10, color: Colors.text },
  timeText: { fontFamily: Typography.fontBodyMed, fontSize: 10, color: Colors.textMuted },
  waveform: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 48 },
  waveBar: { flex: 1, marginHorizontal: 1, backgroundColor: '#bfc8c8', borderRadius: 4 },
  waveBarActive: { backgroundColor: Colors.secondary },
  
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.xl },
  playBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#2e3131', alignItems: 'center', justifyContent: 'center' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  sectionTitle: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeMD, color: Colors.text },
  autoBtn: { backgroundColor: Colors.secondary, borderRadius: Radii.sm, paddingHorizontal: 12, paddingVertical: 6 },
  autoBtnText: { fontFamily: Typography.fontBodyMed, fontSize: 12, color: Colors.white },

  transcriptCard: {
    backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.4)'
  },
  transcriptLabel: { fontFamily: Typography.fontBodyMed, fontSize: 12, color: Colors.secondary, fontWeight: '600', marginBottom: Spacing.sm },
  transcriptInputWrapper: {
    borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.8)', borderRadius: Radii.md,
    flexDirection: 'row', height: 220
  },
  transcriptInput: {
    flex: 1, padding: Spacing.sm, fontFamily: Typography.fontBody, fontSize: 13,
    color: Colors.text, lineHeight: 20
  },


  metadataCard: {
    backgroundColor: 'rgba(15, 92, 92, 0.05)', borderRadius: Radii.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(15, 92, 92, 0.15)'
  },
  metadataHeader: { marginBottom: Spacing.sm },
  metadataTitle: { fontFamily: Typography.fontBodyMed, fontSize: 12, fontWeight: '700', color: Colors.text, textTransform: 'uppercase' },
  metadataGrid: { flexDirection: 'column', gap: Spacing.md },
  metaRowTop: { flexDirection: 'row', gap: Spacing.md },
  metaCol: { flex: 1 },
  metaColFull: { width: '100%' },
  metaLabel: { fontFamily: Typography.fontBodyMed, fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 2 },
  metaValue: { fontFamily: Typography.fontBody, fontSize: 12, color: Colors.text },

  bottomBar: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: 4, gap: Spacing.md
  },
  actionRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.md },
  rejectBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  rejectText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: '#ba1a1a' },
  clarifyBtn: { flex: 2, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  clarifyText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: Colors.secondary, textDecorationLine: 'underline' },
  approveBtn: { backgroundColor: Colors.secondary, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  approveText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeMD, color: Colors.white, fontWeight: '600' },
});
