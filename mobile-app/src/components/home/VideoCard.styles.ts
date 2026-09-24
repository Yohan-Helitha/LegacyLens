import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../../theme';

export const styles = StyleSheet.create({
  // ── Premium Card Shell ────────────────────────────────────────────────────
  premiumCard: {
    backgroundColor: Colors.secondary,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },

  // ── Hero Media Box ────────────────────────────────────────────────────────
  premiumHeroBox: {
    width: '100%',
    height: 220,
    backgroundColor: '#E4E7E6',
    position: 'relative',
  },
  premiumHeroImg: {
    width: '100%',
    height: '100%',
  },

  // ── Overlay Badge (top-right) ─────────────────────────────────────────────
  premiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    zIndex: 10,
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // ── Content Area ──────────────────────────────────────────────────────────
  premiumContent: {
    padding: 18,
  },
  premiumTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: 24,
    color: '#fff',
    marginBottom: 10,
  },
  premiumDesc: {
    fontFamily: Typography.fontBody,
    fontSize: 16,
    color: '#d1dbdb',
    lineHeight: 24,
  },
  premiumDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 16,
  },

  // ── Author Row ────────────────────────────────────────────────────────────
  premiumFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumAuthorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  premiumAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
  },
  premiumAuthorName: {
    color: '#aceeee',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    lineHeight: 17,
    includeFontPadding: false,
  },
  premiumAuthorSub: {
    color: 'rgba(172,238,238,0.7)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 14,
    includeFontPadding: false,
  },

  // ── Video Loader ──────────────────────────────────────────────────────────
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a1010',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    zIndex: 5,
  },
  loaderGrid: {
    width: 45,
    height: 45,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
  },
  loaderSquare: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#fe893e',
    backgroundColor: 'transparent',
  },

  // ── Card Actions ──────────────────────────────────────────────────────────
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F3',
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCount: {
    fontFamily: Typography.fontBodyMed,
    fontSize: 17,
    color: Colors.textMuted,
  },
});
