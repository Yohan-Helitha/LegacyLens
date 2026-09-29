import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../../../theme';

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#eaf2f2' },
  flex1: { flex: 1 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  
  // Header
  header: { height: 64, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: '#e1e3e2' },
  iconBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeMD, fontWeight: '700', color: Colors.secondary },
  pillActive: { backgroundColor: '#fe893e', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  pillActiveText: { fontFamily: Typography.fontBodyMed, fontSize: 12, fontWeight: '600', color: '#672c00' },
  
  scrollContent: { padding: Spacing.md, paddingBottom: 100 },
  introSection: { marginBottom: Spacing.lg },
  pageTitle: { fontFamily: Typography.fontDisplay, fontSize: 28, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  pageSubtitle: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.textMuted },

  segmentContainer: { flexDirection: 'row', backgroundColor: '#eceeed', padding: 4, borderRadius: 8, marginBottom: Spacing.lg },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  segmentBtnActive: { backgroundColor: Colors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  segmentText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.textMuted },
  segmentTextActive: { color: Colors.secondary },

  queueContainer: { gap: Spacing.md },
  
  // Review Cards
  reviewCard: { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.4)', overflow: 'hidden', flexDirection: 'column' },
  reviewImgBox: { height: 160, width: '100%', position: 'relative', backgroundColor: '#f2f4f3' },
  fullImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  reviewCardBody: { padding: Spacing.md },
  cardTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeMD, fontWeight: '600', color: Colors.text, flex: 1 },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eceeed', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.3)' },
  pendingBadgeText: { fontFamily: Typography.fontBodyMed, fontSize: 12, color: Colors.textMuted },
  cardDesc: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.textMuted, marginTop: 8, marginBottom: 16 },
  cardFooter: { flexDirection: 'column', gap: 12, marginTop: 'auto' },
  cardTagsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  elderTag: { backgroundColor: '#4d535a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  elderTagText: { fontFamily: Typography.fontBodyMed, fontSize: 12, color: Colors.white },
  articleTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e1e3e2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  articleTagText: { fontFamily: Typography.fontBodyMed, fontSize: 12, color: Colors.textMuted },
  metaText: { fontFamily: Typography.fontBodyMed, fontSize: 12, color: Colors.text },
  metaTextMuted: { fontFamily: Typography.fontBody, fontSize: 12, color: Colors.textMuted },
  elderBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffdad6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  elderBadgeText: { fontFamily: Typography.fontBodyMed, fontSize: 12, color: '#ba1a1a' },
  studentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15, 92, 92, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  studentBadgeText: { fontFamily: Typography.fontBodyMed, fontSize: 12, color: '#0f5c5c' },
  videoTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e1e3e2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  videoTagText: { fontFamily: Typography.fontBodyMed, fontSize: 12, color: Colors.textMuted },
  
  cardActionsRow: { flexDirection: 'row', gap: 12 },
  rejectBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  rejectBtnText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: '#ba1a1a' },
  publishBtn: { flex: 1, backgroundColor: '#0f5c5c', paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  publishBtnText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.white },

  // Archived Queue
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f2f4f3', borderRadius: 20, paddingHorizontal: 16, height: 40, marginBottom: Spacing.md },
  searchInput: { flex: 1, marginLeft: 8, fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.text },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  archiveCard: { alignSelf: 'stretch', backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.4)', padding: Spacing.md },
  archiveCategoryTag: { backgroundColor: '#eceeed', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.5)' },
  archiveCategoryTagText: { fontFamily: Typography.fontBodyMed, fontSize: 12, color: Colors.textMuted },
  archiveFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(191, 200, 200, 0.2)' },
  
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#fe893e', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  fabText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: '#672c00' },

  // Detail View (Content Review)
  saveDraftBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveDraftBtnText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.secondary },
  detailIntro: { marginBottom: Spacing.md },
  
  videoPlayerContainer: { width: '100%', aspectRatio: 16/9, backgroundColor: '#eceeed', borderRadius: 12, overflow: 'hidden', marginBottom: Spacing.lg, borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.4)' },
  videoBg: { width: '100%', height: '100%' },
  videoOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  playCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  videoProgressBarBg: { height: 6, backgroundColor: 'rgba(225,227,226,0.5)', position: 'absolute', bottom: 0, left: 0, right: 0 },
  videoProgressBarFill: { height: '100%', width: '33%', backgroundColor: '#fe893e' },

  submitterCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: Colors.white, padding: Spacing.md, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.4)', marginBottom: Spacing.md },
  submitterAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#e6e9e8' },
  submitterName: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeMD, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  verifiedTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(15, 92, 92, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(15, 92, 92, 0.2)', alignSelf: 'flex-start' },
  verifiedTagText: { fontFamily: Typography.fontBodyMed, fontSize: 12, color: Colors.secondary },

  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#eceeed', padding: 16, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#fe893e', marginBottom: Spacing.md },
  infoBannerText: { flex: 1, fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.text },

  checklistCard: { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.4)', overflow: 'hidden' },
  checklistHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
  checklistTitle: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.text, marginLeft: 8 },
  checklistContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  divider: { height: 1, backgroundColor: 'rgba(191, 200, 200, 0.3)', marginBottom: 12 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  checkboxDone: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(15, 92, 92, 0.1)', borderWidth: 2, borderColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  checkboxPending: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#bfc8c8', alignItems: 'center', justifyContent: 'center' },
  checkItemText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.text },

  bottomBar: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: Spacing.md, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: 'rgba(191, 200, 200, 0.4)' },
  btnReject: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 24, borderWidth: 2, borderColor: '#6f7978' },
  btnRejectText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.text },
  btnPublish: { flex: 2, backgroundColor: '#0f5c5c', paddingVertical: 14, alignItems: 'center', borderRadius: 24 },
  btnPublishText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.white },

  // Verify Tags Section
  tagsCard: { backgroundColor: Colors.white, padding: Spacing.md, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.4)', marginBottom: Spacing.md },
  tagsCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tagsCardTitle: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.text },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eceeed', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.4)' },
  tagPillActive: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ffdbc9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(155, 70, 0, 0.2)' },
  tagText: { fontFamily: Typography.fontBodyMed, fontSize: 12, color: Colors.text },
  tagTextActive: { fontFamily: Typography.fontBodyMed, fontSize: 12, color: '#672c00', fontWeight: '600' },
  tagRemoveBtn: { padding: 2 },
  addTagBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.secondary },
  addTagText: { fontFamily: Typography.fontBodyMed, fontSize: 12, color: Colors.secondary },
  tagInput: { fontFamily: Typography.fontBodyMed, fontSize: 12, color: Colors.text, paddingVertical: 2, paddingHorizontal: 8, minWidth: 80, borderBottomWidth: 1, borderBottomColor: Colors.secondary },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(46, 49, 49, 0.4)', justifyContent: 'center', alignItems: 'center', padding: Spacing.md },
  modalContent: { width: '100%', maxWidth: 400, backgroundColor: Colors.white, borderRadius: 16, padding: Spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(15, 92, 92, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeLG, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  modalBody: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.textMuted, marginBottom: 24 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  modalBtnCancel: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  modalBtnCancelText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.text },
  modalBtnConfirm: { backgroundColor: Colors.secondary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  modalBtnConfirmText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.white },

  // Reject Modal Inputs
  rejectInputLabel: { fontFamily: Typography.fontBodyMed, fontSize: 14, color: Colors.text, marginBottom: 6, marginTop: 12 },
  rejectSelectContainer: { backgroundColor: '#f2f4f3', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.4)', overflow: 'hidden', marginVertical: 6 },
  rejectSelectOption: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(191, 200, 200, 0.2)' },
  rejectSelectOptionActive: { backgroundColor: '#ffdbc9' },
  rejectSelectOptionText: { fontFamily: Typography.fontBody, fontSize: 14, color: Colors.text },
  rejectSelectOptionTextActive: { fontFamily: Typography.fontBodyMed, fontSize: 14, color: '#672c00', fontWeight: '600' },
  rejectNotesInput: { backgroundColor: '#f2f4f3', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.4)', padding: 12, height: 100, fontFamily: Typography.fontBody, fontSize: 14, color: Colors.text, textAlignVertical: 'top', marginTop: 8 },
  
  modalBtnCancelPill: { flex: 1, backgroundColor: '#eceeed', paddingVertical: 12, alignItems: 'center', borderRadius: 24 },
  modalBtnCancelPillText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.text },
  modalBtnConfirmPill: { flex: 1, backgroundColor: '#ba1a1a', paddingVertical: 12, alignItems: 'center', borderRadius: 24 },
  modalBtnConfirmPillText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.white },
  modalTitleError: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeLG, fontWeight: '600', color: '#ba1a1a', marginBottom: 8 },

  // Article Preview
  articlePreviewCard: { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.4)', padding: Spacing.md, marginBottom: Spacing.md },
  articlePreviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(191, 200, 200, 0.2)', paddingBottom: 12, marginBottom: 16 },
  articlePreviewLabel: { fontFamily: Typography.fontBodyMed, fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  articleReadTimeBadge: { backgroundColor: '#f2f4f3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  articleReadTimeText: { fontFamily: Typography.fontBodyMed, fontSize: 11, color: Colors.secondary, fontWeight: '600' },
  articlePreviewBody: { flex: 1 },
  articlePreviewTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeLG, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  articlePreviewContent: { fontFamily: Typography.fontBody, fontSize: 14, color: Colors.text, lineHeight: 22 },
});
