import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowDown, ArrowUp, BookOpen, Eye, Heart, MessageCircle } from 'lucide-react-native';
import { Typography, Spacing, Radii } from '../../../theme';
import { formatCount } from '../../../utils/formatCount';
import type { AnalyticsSummary } from '../../../types/story';
import { ContentCaptureColors as D } from './tokens';

interface AnalyticsSummaryCardProps {
  summary: AnalyticsSummary | null;
  loading: boolean;
  loadError?: boolean;
  /** Tapping the card opens My Stories. */
  onPress?: () => void;
}

/** Trending → the palette's teal; not trending → its orange. Same colours as the rest of the elder flow. */
const UP = { icon: D.primaryContainer, tint: 'rgba(15,92,92,0.12)', text: D.primaryContainer };
const DOWN = { icon: D.secondaryContainer, tint: 'rgba(254,137,62,0.2)', text: D.secondary };

/**
 * Dashboard summary of how the elder's published stories are doing — YouTube-Studio style: the last
 * 7 days' views with an arrow showing whether that beats the 7 days before (teal up arrow) or not
 * (orange down arrow).
 */
export const AnalyticsSummaryCard: React.FC<AnalyticsSummaryCardProps> = ({
  summary,
  loading,
  loadError,
  onPress,
}) => {
  const hasPublished = !!summary && summary.publishedStories > 0;
  const tone = summary?.trending ? UP : DOWN;
  const Arrow = summary?.trending ? ArrowUp : ArrowDown;
  const percent = summary ? Math.abs(summary.trendPercent) : 0;
  const trendWord = summary?.trending ? 'up' : 'down';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.card, pressed && s.pressed]}
      accessibilityRole="button"
      accessibilityLabel={
        hasPublished
          ? `Story analytics. ${summary.viewsLast7Days} views in the last 7 days, ${trendWord} ${percent} percent. Opens My Stories.`
          : 'Story analytics. Publish a story to see how it is doing. Opens My Stories.'
      }
    >
      <View style={s.headerRow}>
        <Text style={s.title}>Story analytics</Text>
        <Text style={s.period}>Last 7 days</Text>
      </View>

      {loading && (
        <View style={s.centerState}>
          <ActivityIndicator color={D.primary} />
        </View>
      )}

      {!loading && loadError && <Text style={s.mutedText}>Couldn't load your analytics right now.</Text>}

      {!loading && !loadError && !hasPublished && (
        <Text style={s.mutedText}>
          Once a story of yours is published, you'll see how many people watched and loved it here.
        </Text>
      )}

      {!loading && !loadError && hasPublished && summary && (
        <>
          <View style={s.trendRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.bigNumber}>{formatCount(summary.viewsLast7Days)}</Text>
              <Text style={s.bigNumberLabel}>views</Text>
            </View>
            <View style={[s.trendPill, { backgroundColor: tone.tint }]}>
              <Arrow size={20} color={tone.icon} strokeWidth={3} />
              <Text style={[s.trendText, { color: tone.text }]}>{percent}%</Text>
            </View>
          </View>
          <Text style={s.comparison}>
            {summary.trending ? 'More than' : 'Fewer than'} the {formatCount(summary.viewsPrevious7Days)} views in the
            7 days before
          </Text>

          <View style={s.divider} />

          <View style={s.statsRow}>
            <Stat icon={<Eye size={16} color={D.onSurfaceVariant} />} value={summary.totalViews} label="Total views" />
            <Stat icon={<Heart size={16} color={D.onSurfaceVariant} />} value={summary.totalLikes} label="Likes" />
            <Stat
              icon={<MessageCircle size={16} color={D.onSurfaceVariant} />}
              value={summary.totalComments}
              label="Comments"
            />
            <Stat
              icon={<BookOpen size={16} color={D.onSurfaceVariant} />}
              value={summary.publishedStories}
              label="Published"
            />
          </View>
        </>
      )}
    </Pressable>
  );
};

const Stat: React.FC<{ icon: React.ReactNode; value: number; label: string }> = ({ icon, value, label }) => (
  <View style={s.stat}>
    {icon}
    <Text style={s.statValue}>{formatCount(value)}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

const s = StyleSheet.create({
  card: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    gap: Spacing.sm,
  },
  pressed: { opacity: 0.92 },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeLG, color: D.onSurface },
  period: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  centerState: { paddingVertical: Spacing.md, alignItems: 'center' },
  mutedText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, color: D.onSurfaceVariant },

  trendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  bigNumber: { fontFamily: Typography.fontDisplay, fontSize: 40, lineHeight: 46, color: D.onSurface },
  bigNumberLabel: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, color: D.onSurfaceVariant },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radii.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  trendText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG },
  comparison: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: D.outlineVariant, marginVertical: Spacing.xs },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG, color: D.onSurface },
  statLabel: { fontFamily: Typography.fontBody, fontSize: 12, color: D.onSurfaceVariant },
});

export default AnalyticsSummaryCard;
