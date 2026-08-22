import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../../../theme';

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.dominant },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: Spacing.md, 
    height: 56, 
    backgroundColor: Colors.surface,
  },
  headerTitle: { 
    fontFamily: Typography.fontDisplay, 
    fontSize: Typography.sizeXL, 
    fontWeight: '600', 
    color: Colors.secondary 
  },
  iconBtn: { padding: Spacing.sm },
  tabsRow: { 
    flexDirection: 'row', 
    paddingHorizontal: Spacing.md, 
    backgroundColor: Colors.surface,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tab: { flex: 1, paddingBottom: 8, borderBottomWidth: 2, alignItems: 'center' },
  tabActive: { borderBottomColor: Colors.secondary },
  tabInactive: { borderBottomColor: 'transparent' },
  tabTextActive: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.secondary },
  tabTextInactive: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.textMuted },
  
  content: { padding: Spacing.md },
  
  sectionLabel: { fontFamily: Typography.fontBodyMed, fontSize: 10, letterSpacing: 1.5, color: Colors.accent, textTransform: 'uppercase' },
  sectionTitle: { fontFamily: Typography.fontDisplay, fontSize: 24, fontWeight: '600', color: Colors.secondary, marginTop: 4 },
  sectionDesc: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.textMuted, marginTop: 8 },
  sectionMeta: { 
    fontFamily: Typography.fontBodyMed, 
    fontSize: Typography.sizeSM, 
    fontWeight: '600',
    color: Colors.white, 
    marginTop: 16,
    backgroundColor: Colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radii.full,
    alignSelf: 'flex-start'
  },

  labelHeader: { fontFamily: Typography.fontBodyMed, fontSize: 10, color: '#6f7978', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, marginTop: 32 },

  featuredCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(15, 92, 92, 0.2)', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  featuredImageWrapper: { height: 160, width: '100%', backgroundColor: '#f2f4f3' },
  featuredImage: { width: '100%', height: '100%' },
  featuredTag: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radii.full, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(15, 92, 92, 0.2)' },
  featuredTagText: { fontFamily: Typography.fontBodyMed, fontSize: 10, fontWeight: '600', color: Colors.secondary },
  featuredBody: { padding: Spacing.md },
  featuredTitle: { fontFamily: Typography.fontDisplay, fontSize: 20, fontWeight: '600', color: Colors.secondary, marginBottom: 4 },
  featuredSub: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.textMuted, flexDirection: 'row', alignItems: 'center' },
  featuredTime: { fontFamily: Typography.fontBodyMed, fontSize: 10, color: '#6f7978', marginTop: 8 },

  qualityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  qualityLabel: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeMD, color: Colors.text },
  qualityPercent: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '700', color: '#fe893e' },
  qualityBarBg: { height: 8, backgroundColor: '#e6e9e8', borderRadius: 4, overflow: 'hidden', marginBottom: Spacing.md },
  qualityBarFill: { height: '100%', backgroundColor: '#fe893e', borderRadius: 4 },

  checklist: { gap: 4 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checklistText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.text },
  checklistTextMuted: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.textMuted },
  checklistHint: { fontFamily: Typography.fontBodyMed, fontSize: 10, color: Colors.accent, marginTop: 8 },

  featuredActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  btnPrimary: { flex: 1, backgroundColor: '#0f5c5c', paddingVertical: 12, borderRadius: Radii.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnPrimaryText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.white },
  btnOutline: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radii.lg, borderWidth: 1, borderColor: 'rgba(15, 92, 92, 0.2)', alignItems: 'center', justifyContent: 'center' },
  btnOutlineText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.secondary },

  listHeader: { fontFamily: Typography.fontDisplay, fontSize: 20, fontWeight: '600', color: Colors.secondary, marginTop: 32, marginBottom: 16 },
  
  draftItem: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: Spacing.sm, borderWidth: 1, borderColor: 'rgba(15, 92, 92, 0.2)', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1, flexDirection: 'row', gap: 12, marginBottom: 16 },
  draftImgWrapper: { width: 100, height: 100, borderRadius: Radii.md, backgroundColor: '#f2f4f3', overflow: 'hidden' },
  draftImgPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  draftImg: { width: '100%', height: '100%' },
  draftPercent: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  draftPercentText: { fontFamily: Typography.fontBodyMed, fontSize: 10, fontWeight: '700', color: Colors.accent },
  
  draftBody: { flex: 1, justifyContent: 'space-between' },
  draftTitle: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.secondary, marginBottom: 4 },
  draftSub: { fontFamily: Typography.fontBody, fontSize: 12, color: Colors.textMuted },
  draftTime: { fontFamily: Typography.fontBodyMed, fontSize: 10, color: '#6f7978', marginTop: 4 },
  
  draftBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  draftTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  draftTagCheck: { backgroundColor: '#eceeed', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  draftTagEmpty: { backgroundColor: Colors.white, borderWidth: 1, borderColor: '#bfc8c8', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  draftTagTextCheck: { fontFamily: Typography.fontBodyMed, fontSize: 8, textTransform: 'uppercase', color: '#3f4948' },
  draftTagTextEmpty: { fontFamily: Typography.fontBodyMed, fontSize: 8, textTransform: 'uppercase', color: '#6f7978' },
  continueBtn: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.accent, textDecorationLine: 'underline' },

  // Published Stats Row
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 },
  statPill: { backgroundColor: '#f2f4f3', paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radii.full },
  statPillText: { fontFamily: Typography.fontBodyMed, fontSize: 12, color: Colors.text },
  statPillActive: { backgroundColor: 'rgba(232, 121, 46, 0.20)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radii.full },
  statPillActiveText: { fontFamily: Typography.fontBodyMed, fontSize: 12, color: Colors.accent },
  statPillReach: { backgroundColor: 'rgba(15, 92, 92, 0.10)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radii.full, flexDirection: 'row', alignItems: 'center', gap: 4 },
  statPillReachText: { fontFamily: Typography.fontBodyMed, fontSize: 12, color: Colors.secondary },
  statDot: { color: '#c1c7cf' },

  // Published Featured Card Badge
  badgeActive: { position: 'absolute', top: 16, left: 16, backgroundColor: '#fe893e', paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radii.full, flexDirection: 'row', alignItems: 'center', gap: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  badgeActiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ba1a1a' },
  badgeActiveText: { fontFamily: Typography.fontBodyMed, fontSize: 10, fontWeight: '600', color: Colors.white, letterSpacing: 1 },

  // Published Featured Card Content
  pubFeaturedTitle: { fontFamily: Typography.fontDisplay, fontSize: 24, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  pubFeaturedMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 16 },
  pubFeaturedMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: Colors.textMuted },
  
  pubStatsBox: { backgroundColor: Colors.surface, padding: Spacing.sm, borderRadius: Radii.lg, borderWidth: 1, borderColor: 'rgba(15, 92, 92, 0.2)' },
  pubStatsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  pubStatsPartic: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.text, flexDirection: 'row', alignItems: 'center', gap: 8 },
  pubStatsReach: { fontFamily: Typography.fontBodyMed, fontSize: 12, color: Colors.textMuted, textAlign: 'right' },
  pubStatsReachNum: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.accent },
  
  pubBtnSecondary: { backgroundColor: 'transparent', paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.textMuted, alignItems: 'center', justifyContent: 'center' },
  pubBtnSecondaryText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.text },

  // Published List Item
  pubListItem: { backgroundColor: Colors.white, borderRadius: Radii.xl, borderWidth: 1, borderColor: 'rgba(15, 92, 92, 0.2)', flexDirection: 'row', overflow: 'hidden', marginBottom: 16 },
  pubListImg: { width: 110, height: '100%', minHeight: 120, backgroundColor: '#f2f4f3' },
  pubListContent: { flex: 1, padding: Spacing.sm, justifyContent: 'space-between' },
  pubListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  pubListTitle: { flex: 1, fontFamily: Typography.fontDisplay, fontSize: Typography.sizeMD, fontWeight: '600', color: Colors.text },
  badgeCompleted: { backgroundColor: '#f2f4f3', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeCompletedText: { fontFamily: Typography.fontBodyMed, fontSize: 10, color: Colors.textMuted, letterSpacing: 1 },
  badgeActiveSmall: { backgroundColor: 'rgba(232, 121, 46, 0.20)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeActiveSmallText: { fontFamily: Typography.fontBodyMed, fontSize: 10, color: Colors.accent, letterSpacing: 1 },
  badgeRemoved: { backgroundColor: '#ffebeb', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeRemovedText: { fontFamily: Typography.fontBodyMed, fontSize: 10, color: '#ba1a1a', letterSpacing: 1 },
  
  pubListDate: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  pubListDateText: { fontFamily: Typography.fontBody, fontSize: 12, color: Colors.textMuted },
  pubListSub: { fontFamily: Typography.fontBody, fontSize: 13, color: Colors.textMuted, marginTop: 8 },
  
  pubListActionBtn: { alignSelf: 'flex-start', marginTop: 12, paddingVertical: 8, paddingHorizontal: 16, borderRadius: Radii.lg, backgroundColor: 'rgba(15, 92, 92, 0.05)' },
  pubListActionText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.secondary }
});
