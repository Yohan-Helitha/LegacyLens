import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../../theme';

export const styles = StyleSheet.create({
  // ── Card Shell ────────────────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.secondarySubtle,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.md,
  },

  // ── Card Header (avatar + name + badge) ───────────────────────────────────
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  authorName: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeMD,
    fontWeight: '600',
    color: Colors.text,
  },
  timeAgo: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
    marginTop: 2,
  },
  authorInitialBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 92, 92, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitialText: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeMD,
    fontWeight: '700',
    color: '#0f5c5c',
  },

  // ── Audio Type Badge ──────────────────────────────────────────────────────
  audioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(254, 137, 62, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  audioBadgeText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent,
    textTransform: 'uppercase',
  },

  // ── Topic Title ───────────────────────────────────────────────────────────
  audioTopic: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeMD,
    fontWeight: '600',
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },

  // ── Waveform Strip ────────────────────────────────────────────────────────
  audioStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f5c5c',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    borderRadius: Radii.lg,
    gap: 12,
  },
  audioPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioDurationText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeXS,
    color: Colors.white,
  },
});
