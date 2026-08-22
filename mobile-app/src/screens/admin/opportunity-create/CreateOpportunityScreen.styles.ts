import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../../../theme';

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#eaf2f2' },
  header: {
    height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  iconButton: { padding: Spacing.xs },
  headerTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeMD, fontWeight: '700', color: Colors.secondary },
  saveDraftButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radii.md },
  saveDraftText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.secondary },
  
  progressContainer: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  progressBarsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  progressBarSegment: { height: 6, flex: 1, borderRadius: 3 },
  progressBarActive: { backgroundColor: '#fe893e' },
  progressBarInactive: { backgroundColor: '#e1e3e2' },
  progressText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: Colors.textMuted, textAlign: 'right' },

  scrollContent: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  
  welcomeCard: { marginBottom: Spacing.lg },
  welcomeText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.text, lineHeight: 22 },
  
  formGroup: { marginBottom: Spacing.lg },
  label: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeMD, fontWeight: '600', color: Colors.textMuted, marginBottom: 8 },
  textInput: {
    backgroundColor: Colors.white, borderBottomWidth: 2, borderBottomColor: Colors.secondary,
    fontFamily: Typography.fontDisplay, fontSize: Typography.sizeMD, color: Colors.text,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs,
  },
  
  imageUploadArea: {
    height: 200, borderWidth: 2, borderStyle: 'dashed', borderColor: '#bfc8c8',
    borderRadius: Radii.xl, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
  },
  imageUploadText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.textMuted, marginTop: 8 },
  
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radii.full, borderWidth: 1, borderColor: '#bfc8c8', backgroundColor: Colors.white },
  chipText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.text },
  chipActive: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radii.full, borderWidth: 1, borderColor: '#fe893e', backgroundColor: '#fe893e' },
  chipActiveText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.white },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.95)', borderTopWidth: 1, borderTopColor: '#e1e3e2', padding: Spacing.md, flexDirection: 'row', gap: Spacing.md },
  bottomBtnSecondary: { flex: 1, backgroundColor: '#e6e9e8', paddingVertical: 14, borderRadius: Radii.lg, alignItems: 'center' },
  bottomBtnSecondaryText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.text },
  bottomBtnPrimary: { flex: 1, backgroundColor: Colors.secondary, paddingVertical: 14, borderRadius: Radii.lg, alignItems: 'center' },
  bottomBtnPrimaryText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.white },
  
  // Step 2 & others
  titleSection: { marginBottom: Spacing.lg },
  pageTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.size2XL, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  pageSubtitle: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.textMuted },
  
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radii.xl, borderWidth: 1, borderColor: '#bfc8c8', paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 16, fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.text },
  
  profilesGrid: { gap: Spacing.md, marginBottom: Spacing.lg },
  profileCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.3)', padding: Spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  profileAvatarContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#eceeed', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.2)' },
  profileInfo: { flex: 1 },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  profileName: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeMD, fontWeight: '600', color: Colors.text },
  profileRole: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: Colors.textMuted, marginBottom: 4 },
  profileLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  profileLocation: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: Colors.textMuted },
  
  addHolderBtn: { borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(191, 200, 200, 0.5)', borderRadius: Radii.xl, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addHolderText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '700', color: Colors.secondary },

  // Step 3
  cardSection: { backgroundColor: Colors.white, borderRadius: Radii.xl, borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.2)', padding: Spacing.md, marginBottom: Spacing.lg },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  sectionTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeMD, fontWeight: '600', color: Colors.secondary },
  searchBarContainerBordered: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f2f4f3', borderBottomWidth: 2, borderBottomColor: Colors.secondary, borderTopLeftRadius: Radii.sm, borderTopRightRadius: Radii.sm, paddingHorizontal: Spacing.sm },
  searchInputBordered: { flex: 1, paddingVertical: 12, fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.text },
  mapPreviewBox: { height: 180, borderRadius: Radii.md, overflow: 'hidden', marginTop: Spacing.sm, backgroundColor: '#e1e3e2' },
  mapImage: { width: '100%', height: '100%', opacity: 0.8 },
  
  sectionHeaderRowSpaceBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: Colors.textMuted },
  scheduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  scheduleBox: { width: '48%', backgroundColor: '#f2f4f3', borderRadius: Radii.md, padding: Spacing.sm, borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.2)' },
  scheduleLabel: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: '#6f7978', marginBottom: 4 },
  scheduleValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scheduleValue: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '500', color: Colors.text },
  
  amountInputContainer: { marginTop: Spacing.md, maxWidth: 200 },
  amountInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f2f4f3', borderBottomWidth: 2, borderBottomColor: Colors.secondary, borderTopLeftRadius: Radii.sm, borderTopRightRadius: Radii.sm, paddingHorizontal: Spacing.sm },
  currencyPrefix: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.textMuted, marginRight: 8 },
  amountInput: { flex: 1, paddingVertical: 12, fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.text },

  bottomBarRightOnly: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.95)', borderTopWidth: 1, borderTopColor: '#e1e3e2', padding: Spacing.md, flexDirection: 'row', justifyContent: 'flex-end' },
  
  // Step 4
  cardLabelBold: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeMD, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  cardSubtitle: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: Colors.textMuted, marginBottom: 12 },
  textArea: { backgroundColor: '#f2f4f3', borderBottomWidth: 2, borderBottomColor: Colors.secondary, borderTopLeftRadius: Radii.sm, borderTopRightRadius: Radii.sm, padding: Spacing.sm, fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.text, minHeight: 100 },
  charCount: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: Colors.textMuted, textAlign: 'right', marginTop: 4 },
  
  taskList: { gap: Spacing.sm, marginBottom: Spacing.sm },
  taskItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  taskNumberCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#eceeed', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  taskNumberText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.textMuted },
  taskInput: { flex: 1, backgroundColor: '#f2f4f3', borderBottomWidth: 2, borderBottomColor: Colors.secondary, borderTopLeftRadius: Radii.sm, borderTopRightRadius: Radii.sm, paddingVertical: 12, paddingHorizontal: Spacing.sm, fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.text },
  addTaskBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, paddingHorizontal: 8, alignSelf: 'flex-start' },
  addTaskBtnText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: '#fe893e' },
  
  deliverablesList: { gap: 8 },
  checkItemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.sm, borderRadius: Radii.md, borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.2)' },
  checkbox: { width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: '#bfc8c8', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  checkItemText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.text },
  
  bottomBarSpaceBetween: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.95)', borderTopWidth: 1, borderTopColor: '#e1e3e2', padding: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  btnTextOnly: { paddingHorizontal: 16, paddingVertical: 8 },
  btnTextOnlyLabel: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.textMuted },
  btnActionPrimary: { backgroundColor: Colors.secondary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radii.full, flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnActionPrimaryText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '700', color: Colors.white },
  
  // Step 5
  qualityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  qualityLabel: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeMD, color: Colors.text },
  qualityPercent: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '700', color: '#fe893e' },
  qualityBarBg: { height: 8, backgroundColor: '#e6e9e8', borderRadius: 4, overflow: 'hidden', marginBottom: Spacing.md },
  qualityBarFill: { height: '100%', backgroundColor: '#fe893e', borderRadius: 4 },
  checklist: { gap: 4 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checklistText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.text },
  checklistTextMuted: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.textMuted },
  
  sectionHeading: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeXL, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  previewCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.2)', overflow: 'hidden', position: 'relative' },
  previewTag: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radii.full, flexDirection: 'row', alignItems: 'center', gap: 4, zIndex: 10, borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.3)' },
  previewTagText: { fontFamily: Typography.fontBodyMed, fontSize: 10, fontWeight: '600', color: Colors.textMuted },
  previewImage: { width: '100%', height: 200, backgroundColor: '#e6e9e8' },
  previewContent: { padding: Spacing.md },
  previewHostRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.sm },
  previewHostAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: Colors.white },
  previewHostName: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.text },
  previewLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  previewLocation: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: Colors.textMuted },
  previewTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeMD, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  previewDesc: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.textMuted, marginBottom: Spacing.md },
  previewBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(191, 200, 200, 0.2)', paddingTop: Spacing.sm },
  previewBadgesRow: { flexDirection: 'row', gap: 8 },
  previewBadge: { backgroundColor: '#f2f4f3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.3)', flexDirection: 'row', alignItems: 'center', gap: 4 },
  previewBadgeText: { fontFamily: Typography.fontBodyMed, fontSize: 10, color: Colors.textMuted },
  previewPrice: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeMD, fontWeight: '700', color: Colors.secondary },

  btnActionSecondary: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  btnActionSecondaryText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.secondary },
  
  // Step 6: Success
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  successIconBox: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg, marginTop: 40, borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.3)' },
  successTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeXL, fontWeight: '600', color: Colors.text, textAlign: 'center', marginBottom: Spacing.sm },
  successSubtitle: { fontFamily: Typography.fontBody, fontSize: Typography.sizeLG, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.xl },
  
  successCard: { width: '100%', backgroundColor: Colors.white, borderRadius: Radii.xl, padding: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1, borderColor: 'rgba(191, 200, 200, 0.2)', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, marginBottom: Spacing.xl },
  successCardImg: { width: 80, height: 80, borderRadius: Radii.md, backgroundColor: '#f2f4f3' },
  successCardInfo: { flex: 1 },
  successCardTag: { fontFamily: Typography.fontBodyMed, fontSize: 10, fontWeight: '600', color: Colors.secondary, textTransform: 'uppercase', marginBottom: 4 },
  successCardTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeMD, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  successLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  successLocationText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.textMuted },
  
  successActions: { width: '100%', gap: Spacing.sm },
  btnFullPrimary: { width: '100%', backgroundColor: Colors.secondary, paddingVertical: 16, borderRadius: Radii.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnFullPrimaryText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '700', color: Colors.white },
  btnFullOutline: { width: '100%', backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.secondary, paddingVertical: 14, borderRadius: Radii.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnFullOutlineText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.secondary },
  btnTextOnlyCenter: { width: '100%', paddingVertical: 12, alignItems: 'center' },
  btnTextOnlyCenterText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.textMuted },
});
