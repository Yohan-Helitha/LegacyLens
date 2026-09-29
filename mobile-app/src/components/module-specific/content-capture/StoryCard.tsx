import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, Clock, FileText, Mic, Trash2, Video } from 'lucide-react-native';
import { Typography, Spacing, Radii } from '../../../theme';
import { formatRelativeTime } from '../../../utils/dateFormat';
import type { StoryResponse } from '../../../types/story';
import { ContentCaptureColors as D } from './tokens';

export type StoryCardStatus = 'published' | 'pending';

export interface StoryCardItem {
  id: string;
  title: string;
  description: string | null;
  recordedAt: string;
  status: StoryCardStatus;
  hasMedia: boolean;
  mediaKind: 'audio' | 'video' | null;
  mediaDurationMillis: number | null;
}

/** Maps a backend StoryResponse straight into what StoryCard needs to render. */
export function toStoryCardItem(story: StoryResponse): StoryCardItem {
  return {
    id: story.id,
    title: story.title,
    description: story.description,
    recordedAt: formatRelativeTime(story.createdAt),
    status: story.status === 'PUBLISHED' ? 'published' : 'pending',
    hasMedia: !!story.mediaUrl,
    mediaKind: story.mediaType === 'VIDEO' ? 'video' : story.mediaType === 'AUDIO' ? 'audio' : null,
    mediaDurationMillis: story.mediaDurationMillis,
  };
}

function formatDuration(ms: number | null): string | null {
  if (!ms) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

interface StoryCardProps {
  story: StoryCardItem;
  /** Opens the read-only story viewer — also fires from tapping the media hero */
  onReview?: () => void;
  onDelete?: () => void;
}

/**
 * One story in a "your stories" list. Media stories (voice/video) lead with
 * an icon hero so the type is obvious at a glance; written stories lead with
 * a text snippet instead since there's nothing to preview. Pending stories
 * (everything today — there's no publish flow yet) get Review/Delete actions;
 * intentionally no like/comment/share, this list isn't a public feed.
 */
export const StoryCard: React.FC<StoryCardProps> = ({ story, onReview, onDelete }) => {
  const isPublished = story.status === 'published';
  const duration = formatDuration(story.mediaDurationMillis);
  const MediaIcon = story.mediaKind === 'video' ? Video : Mic;

  return (
    <View style={s.card}>
      {story.hasMedia && (
        <Pressable
          onPress={onReview}
          style={({ pressed }) => [s.mediaHero, pressed && s.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Open ${story.mediaKind === 'video' ? 'video' : 'voice'} story`}
        >
          <View style={s.mediaIconWrap}>
            <MediaIcon size={26} color={D.onPrimary} strokeWidth={2} />
          </View>
          <Text style={s.mediaLabel}>
            {story.mediaKind === 'video' ? 'Video story' : 'Voice recording'}
            {duration ? ` · ${duration}` : ''}
          </Text>
        </Pressable>
      )}

      <View style={s.body}>
        <View style={s.headerRow}>
          {!story.hasMedia && (
            <View style={s.textIconWrap}>
              <FileText size={18} color={D.onSecondaryContainer} strokeWidth={2} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.title} numberOfLines={1}>{story.title}</Text>
            <Text style={s.meta}>{story.recordedAt}</Text>
          </View>
          <View style={[s.statusBadge, isPublished ? s.statusBadgePublished : s.statusBadgePending]}>
            {isPublished ? (
              <CheckCircle2 size={13} color={D.primary} strokeWidth={2} />
            ) : (
              <Clock size={13} color={D.onSecondaryContainer} strokeWidth={2} />
            )}
            <Text style={[s.statusBadgeText, isPublished ? s.statusBadgeTextPublished : s.statusBadgeTextPending]}>
              {isPublished ? 'Published' : 'Pending'}
            </Text>
          </View>
        </View>

        {!story.hasMedia && !!story.description && (
          <Text style={s.snippet} numberOfLines={2}>{story.description}</Text>
        )}

        {!isPublished && (
          <View style={s.btnRow}>
            <Pressable
              onPress={onReview}
              style={({ pressed }) => [s.reviewBtn, pressed && s.pressedLight]}
              accessibilityRole="button"
            >
              <Text style={s.reviewBtnText}>Review Content</Text>
            </Pressable>
            <Pressable
              onPress={onDelete}
              style={({ pressed }) => [s.deleteBtn, pressed && s.pressedLight]}
              accessibilityRole="button"
            >
              <Trash2 size={15} color="#ba1a1a" strokeWidth={2} />
              <Text style={s.deleteBtnText}>Delete Content</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  mediaHero: {
    height: 96,
    backgroundColor: D.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mediaIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaLabel: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    color: D.onPrimary,
    opacity: 0.9,
  },

  body: { padding: Spacing.md, gap: Spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  textIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(254,137,62,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.onSurface },
  meta: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant, marginTop: 2 },

  snippet: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
    lineHeight: 20,
  },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radii.full,
  },
  statusBadgePublished: { backgroundColor: 'rgba(0,67,67,0.1)' },
  statusBadgePending:   { backgroundColor: 'rgba(254,137,62,0.2)' },
  statusBadgeText:      { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, letterSpacing: 0.3 },
  statusBadgeTextPublished: { color: D.primary },
  statusBadgeTextPending:   { color: D.onSecondaryContainer },

  btnRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: 2 },
  reviewBtn: {
    flex: 1, minHeight: 44, borderRadius: Radii.lg,
    backgroundColor: D.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  reviewBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onPrimary },
  deleteBtn: {
    flex: 1, minHeight: 44, borderRadius: Radii.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(186,26,26,0.35)',
    backgroundColor: 'rgba(186,26,26,0.06)',
  },
  deleteBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ba1a1a' },

  pressed: { opacity: 0.85 },
  pressedLight: { opacity: 0.88 },
});

export default StoryCard;
