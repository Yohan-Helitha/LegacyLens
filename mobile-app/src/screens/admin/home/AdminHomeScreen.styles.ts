import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../../../theme';

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#eaf2f2' },
  scrollContent: { paddingTop: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.lg },



  // Sections
  section: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: Typography.fontDisplay, fontSize: Typography.sizeMD + 2,
    fontWeight: 'bold', color: Colors.text,
  },
  viewAllText: {
    fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM,
    color: Colors.secondary, fontWeight: '600',
  },

  // Greeting
  greetingTitle: {
    fontFamily: Typography.fontDisplay, fontSize: Typography.size2XL - 4,
    fontWeight: '700', color: Colors.text,
  },
  greetingSubtitle: {
    fontFamily: Typography.fontBody, fontSize: Typography.sizeSM,
    color: Colors.textMuted,
  },

  // Attention Grid
  attentionGrid: {
    paddingHorizontal: Spacing.md,
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md,
  },
  attentionCard: {
    flex: 1, minWidth: '44%',
    backgroundColor: Colors.white, borderRadius: Radii.xl,
    padding: Spacing.md, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  attentionCardFull: {
    width: '100%', backgroundColor: Colors.white, borderRadius: Radii.xl,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  attentionFullLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  attentionCircleTeal: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.secondary,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  attentionCircleRed: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#FFDAD6',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  attentionCount: {
    fontFamily: Typography.fontDisplay, fontSize: Typography.sizeXL,
    fontWeight: '700', color: Colors.white,
  },
  attentionLabel: {
    fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM,
    fontWeight: '600', color: Colors.text,
  },
  attentionSub: {
    fontFamily: Typography.fontBody, fontSize: Typography.sizeXS,
    color: Colors.textMuted, marginTop: 2,
  },
  publishIconCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(232,121,46,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Voice Cards
  voiceCard: {
    backgroundColor: Colors.white, borderRadius: Radii.xl, padding: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(15,92,92,0.1)', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  voiceCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  voiceAvatarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  voiceAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface },
  voiceName: {
    fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM,
    fontWeight: '600', color: Colors.text,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  locationText: {
    fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: Colors.textMuted,
  },
  durationBadge: {
    backgroundColor: Colors.surface, borderRadius: Radii.sm,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  durationText: {
    fontFamily: Typography.fontBodyMed, fontSize: 11, color: Colors.text,
  },
  waveformContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 32,
  },
  waveBar: { flex: 1, marginHorizontal: 2, borderRadius: 2, opacity: 0.6 },
  
  actionArea: { alignItems: 'flex-end', justifyContent: 'center', marginTop: 8 },
  btnPrimary: { 
    backgroundColor: Colors.secondary, paddingHorizontal: 24, paddingVertical: 12, 
    borderRadius: Radii.md, flexDirection: 'row', alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
  },
  btnPrimaryText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.white },

  // Opportunities Banner
  oppsBanner: {
    marginHorizontal: Spacing.md,
    backgroundColor: 'rgba(254, 137, 62, 0.1)',
    borderWidth: 1, borderColor: 'rgba(254,137,62,0.3)',
    borderRadius: Radii.xl, padding: Spacing.md, gap: Spacing.md,
  },
  oppsBannerHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  oppsIconBox: {
    backgroundColor: Colors.accent, borderRadius: Radii.md,
    padding: 8, alignItems: 'center', justifyContent: 'center',
  },
  oppsBannerTitle: {
    fontFamily: Typography.fontDisplay, fontSize: Typography.sizeMD + 2,
    fontWeight: '600', color: Colors.text, marginBottom: 2,
  },
  oppsBannerBody: {
    fontFamily: Typography.fontBody, fontSize: Typography.sizeSM,
    color: Colors.textMuted, lineHeight: 20,
  },
  createOppsBtn: {
    backgroundColor: Colors.accent, borderRadius: Radii.lg,
    paddingVertical: 12, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  createOppsBtnText: {
    fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM,
    fontWeight: '700', color: Colors.white,
  },

  // Newly Added Content Cards
  contentCard: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 8,
    borderWidth: 1, borderColor: 'rgba(15,92,92,0.1)', alignItems: 'center', gap: 12,
  },
  contentImage: { width: 80, height: 80, borderRadius: Radii.md, backgroundColor: '#f2f4f3' },
  contentInfo: { flex: 1, justifyContent: 'center' },
  contentTag: { alignSelf: 'flex-start', backgroundColor: 'rgba(15,92,92,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 6 },
  contentTagText: { fontFamily: Typography.fontBodyMed, fontSize: 10, fontWeight: '700', color: Colors.secondary, textTransform: 'uppercase' },
  contentTitle: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  contentMeta: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: Colors.textMuted },

});
