import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Eye } from 'lucide-react-native';
import { AudioCard } from '../../home/AudioCard';
import { CommentModal } from '../../common/CommentModal';
import { BlogDetailScreen, VideoDetailScreen } from '../../../screens/content-details';
import { homeApi } from '../../../services/api/homeApi';
import type { FeedItemResponse } from '../../../services/api/homeApi';
import { storiesApi } from '../../../services/api/storiesApi';
import type { StoryResponse } from '../../../types/story';
import type { TFunction } from 'i18next';
import { Typography, Spacing, Radii } from '../../../theme';
import { StoryMediaThumb } from './StoryMediaThumb';
import { ContentCaptureColors as D } from './tokens';
import { useTranslation } from 'react-i18next';

interface StoryListenerPreviewProps {
  storyId: string;
}

function formatDuration(millis: number | null): string | null {
  if (!millis || millis <= 0) return null;
  const totalSeconds = Math.round(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function typeLabel(story: StoryResponse, t: TFunction): string {
  if (story.mediaType === 'VIDEO') return t('preview.typeVideo');
  if (story.mediaType === 'AUDIO') return t('preview.typeAudio');
  return t('preview.typeWritten');
}

/**
 * A preview of one of the elder's published stories: its details, plus "View as listeners see it", which
 * opens the same screen listeners get on the Home feed (video player, blog page, or audio card) in a modal —
 * so the elder sees exactly what the community sees. The listener view is looked up from the Home feed,
 * which only contains published stories.
 */
export const StoryListenerPreview: React.FC<StoryListenerPreviewProps> = ({ storyId }) => {
  const { t } = useTranslation('contentCapture');
  const [story, setStory] = useState<StoryResponse | null>(null);
  const [opening, setOpening] = useState(false);
  const [notInFeed, setNotInFeed] = useState(false);
  const [post, setPost] = useState<FeedItemResponse | null>(null);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState('');

  useEffect(() => {
    let cancelled = false;
    storiesApi
      .getById(storyId)
      .then((result) => {
        if (!cancelled) setStory(result);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [storyId]);

  const openListenerView = async () => {
    setOpening(true);
    setNotInFeed(false);
    try {
      const items = await homeApi.getFeedItems();
      const match = items.find((item) => String(item.id) === storyId);
      if (match) {
        setPost(match);
      } else {
        setNotInFeed(true);
      }
    } catch {
      setNotInFeed(true);
    } finally {
      setOpening(false);
    }
  };

  const close = () => setPost(null);
  const duration = story ? formatDuration(story.mediaDurationMillis) : null;

  return (
    <View style={s.card}>
      <Text style={s.sectionTitle}>{t('preview.title')}</Text>

      {story && (
        <>
          <View style={s.thumbWrap}>
            <StoryMediaThumb mediaType={story.mediaType} variant="hero" />
          </View>

          <View style={s.metaRow}>
            <View style={s.chip}>
              <Text style={s.chipText}>{typeLabel(story, t)}</Text>
            </View>
            {!!duration && (
              <View style={s.chip}>
                <Text style={s.chipText}>{duration}</Text>
              </View>
            )}
          </View>

          {!!story.description && (
            <Text style={s.description} numberOfLines={4}>
              {story.description}
            </Text>
          )}
        </>
      )}

      <Pressable
        onPress={openListenerView}
        disabled={opening}
        style={({ pressed }) => [s.button, pressed && s.pressed, opening && s.buttonBusy]}
        accessibilityRole="button"
        accessibilityLabel={t('preview.viewAsAria')}
      >
        {opening ? (
          <ActivityIndicator color={D.onPrimary} />
        ) : (
          <>
            <Eye size={18} color={D.onPrimary} strokeWidth={2.2} />
            <Text style={s.buttonText}>{t('preview.viewAs')}</Text>
          </>
        )}
      </Pressable>

      {notInFeed && (
        <Text style={s.note}>{t('preview.notInFeed')}</Text>
      )}

      <Modal visible={!!post} animationType="slide" onRequestClose={close}>
        {post?.type === 'video' && (
          <VideoDetailScreen
            post={post}
            onBack={close}
            onNavigateMap={close}
            onNavigateSearch={close}
            onSelectRelatedPost={(related) => setPost(related)}
          />
        )}

        {post?.type === 'blog' && <BlogDetailScreen post={post} onBack={close} onNavigateSearch={close} />}

        {post?.type === 'audio' && (
          <SafeAreaView style={s.audioFrame}>
            <Pressable
              onPress={close}
              style={s.audioBack}
              accessibilityRole="button"
              accessibilityLabel={t('preview.backAria')}
            >
              <ArrowLeft size={22} color={D.onSurface} />
              <Text style={s.audioBackText}>{t('back', { ns: 'common' })}</Text>
            </Pressable>
            <View style={{ padding: Spacing.md }}>
              <AudioCard
                a={post}
                item={post}
                setActivePostId={setCommentsPostId}
                setCommentModalVisible={setCommentsVisible}
              />
            </View>
            <CommentModal
              visible={commentsVisible}
              onClose={() => setCommentsVisible(false)}
              postId={commentsPostId}
            />
          </SafeAreaView>
        )}
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    gap: Spacing.sm,
  },
  sectionTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeLG, color: D.onSurface },

  thumbWrap: { borderRadius: Radii.lg, overflow: 'hidden' },
  metaRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radii.full,
    backgroundColor: D.surfaceContainerLow,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
  },
  chipText: { fontFamily: Typography.fontBodySemi, fontSize: 12, color: D.onSurfaceVariant },
  description: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, color: D.onSurface },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    backgroundColor: D.primaryContainer,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.lg,
  },
  buttonBusy: { opacity: 0.7 },
  pressed: { opacity: 0.88 },
  buttonText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.onPrimary },
  note: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant, textAlign: 'center' },

  audioFrame: { flex: 1, backgroundColor: D.surface },
  audioBack: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.md },
  audioBackText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.onSurface },
});

export default StoryListenerPreview;
