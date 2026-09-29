import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eaf2f2' },
  scrollContent: { padding: Spacing.md, paddingBottom: 100 },
  
  titleArea: { marginBottom: Spacing.lg },
  pageTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeXL, fontWeight: '800', color: Colors.secondary },
  
  filterWrapper: { marginBottom: Spacing.lg, marginHorizontal: -Spacing.md },
  filterScroll: { paddingHorizontal: Spacing.md, gap: 8, paddingBottom: 8 },
  filterChip: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#fe893e', borderRadius: 24, 
    paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: '#fe893e',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
  },
  filterChipActive: {
    backgroundColor: '#0f5c5c',
    borderColor: '#0f5c5c',
    shadowOpacity: 0, elevation: 0
  },
  filterDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  filterText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.white },
  filterTextActive: { color: Colors.white },
  filterCountBadge: { marginLeft: 8, backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  filterCountBadgeActive: { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
  filterCountText: { fontFamily: Typography.fontBodyMed, fontSize: 12, color: Colors.white },
  filterCountTextActive: { color: Colors.white, fontWeight: '700' },

  listContainer: { gap: Spacing.md },
  card: { 
    backgroundColor: Colors.white, borderRadius: Radii.xl, padding: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.3)',
    flexDirection: 'column',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  cardOpaque: { opacity: 0.75 },
  cardMain: { flex: 1, marginBottom: 16 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardName: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeMD, fontWeight: '600', color: Colors.secondary },
  
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: Typography.fontBodyMed, fontSize: 12, color: Colors.textMuted },
  durationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f2f4f3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  
  statusBox: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#f2f4f3', 
    padding: 12, borderRadius: Radii.md, borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.2)',
    gap: 12
  },
  statusBoxError: { backgroundColor: 'rgba(186, 26, 26, 0.05)', borderColor: 'rgba(186, 26, 26, 0.2)' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 130 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: Colors.text },
  
  waveformMock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1, height: 32 },
  waveBar: { flex: 1, marginHorizontal: 2, borderRadius: 2, backgroundColor: Colors.secondary, height: '100%', opacity: 0.6 },
  waveBarActive: { backgroundColor: Colors.accent, opacity: 1 },

  actionArea: { alignItems: 'flex-end', justifyContent: 'center' },
  btnPrimary: { 
    backgroundColor: Colors.secondary, paddingHorizontal: 24, paddingVertical: 12, 
    borderRadius: Radii.md, flexDirection: 'row', alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
  },
  btnPrimaryText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.white },
  
  btnOutline: { 
    backgroundColor: '#fe893e', paddingHorizontal: 24, paddingVertical: 12, 
    borderRadius: Radii.md, borderWidth: 1, borderColor: '#fe893e'
  },
  btnOutlineText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '700', color: Colors.white },
  
  btnGhost: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radii.md, backgroundColor: 'transparent' },
  btnGhostText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: 'bold', color: Colors.secondary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(54, 60, 66, 0.4)', justifyContent: 'flex-end' },
  modalCloseArea: { flex: 1 },
  bottomSheet: {
    backgroundColor: '#0f5c5c', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: 48,
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.12, shadowRadius: 30, elevation: 10
  },
  dragHandle: { width: 48, height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, alignSelf: 'center', marginBottom: Spacing.md },
  
  playerHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: Spacing.lg },
  previewSub: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: '#fe893e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  previewTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeMD, fontWeight: '600', color: Colors.white },
  closePlayerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  
  playerWaveformContainer: { marginBottom: Spacing.md, width: '100%' },
  playerWaveform: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 64, paddingHorizontal: 8 },
  playerWaveBar: { flex: 1, marginHorizontal: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4 },
  playerWaveBarActive: { backgroundColor: '#fe893e' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingHorizontal: 4 },
  timeTextActive: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: '#fe893e' },
  timeText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: 'rgba(255,255,255,0.7)' },
  
  playerControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.xl, marginBottom: Spacing.lg },
  controlBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  playPauseBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fe893e', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  
  fullReviewBtn: { width: '100%', backgroundColor: '#fe893e', paddingVertical: 16, borderRadius: Radii.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  fullReviewBtnText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeMD, fontWeight: '600', color: Colors.white },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#0f5c5c',
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.text,
    marginLeft: 8,
    padding: 0,
  },
  filterButton: {
    backgroundColor: '#eceeed',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#0f5c5c',
  },
  filterDrawer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#0f5c5c',
    padding: 16,
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterDrawerTitle: {
    fontFamily: Typography.fontBodyMed,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
});
