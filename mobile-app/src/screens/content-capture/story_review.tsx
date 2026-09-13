import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio, ResizeMode, Video } from 'expo-av';
import { Pause, Play, Trash2 } from 'lucide-react-native';
import { ConfirmDialog, Header, RoundIconButton, UserFooter } from '../../components/common';
import type { UserTabKey } from '../../components/common';
import { ContentCaptureColors as D } from '../../components/module-specific/content-capture';
import { getMediaUrl } from '../../constants/api';
import { ApiError } from '../../services/api/client';
import { storiesApi } from '../../services/api/storiesApi';
import { Typography, Spacing, Radii } from '../../theme';
import type { StoryResponse } from '../../types/story';

interface StoryReviewProps {
  story: StoryResponse;
  onBack?: () => void;
  /** Fired once the story has actually been deleted server-side */
  onDeleted?: () => void;
  onTabPress?: (tab: UserTabKey) => void;
}

function formatDuration(ms: number | null): string | null {
  if (!ms) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Viewer + editor for a saved story, reached by tapping "Review Content" on
 * a story card. Title/description can be edited and saved back — there's no
 * re-upload endpoint, so the media clip itself isn't editable here, only
 * deletable.
 */
export const StoryReview: React.FC<StoryReviewProps> = ({ story, onBack, onDeleted, onTabPress }) => {
  const [title, setTitle] = useState(story.title);
  const [description, setDescription] = useState(story.description ?? '');
  const [savedTitle, setSavedTitle] = useState(story.title);
  const [savedDescription, setSavedDescription] = useState(story.description ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const isDirty = title.trim() !== savedTitle || description.trim() !== savedDescription;

  const toggleAudioPlayback = async () => {
    if (!story.mediaUrl) return;

    if (isPlaying) {
      await soundRef.current?.pauseAsync();
      setIsPlaying(false);
      return;
    }

    if (!soundRef.current) {
      const { sound } = await Audio.Sound.createAsync({ uri: getMediaUrl(story.mediaUrl) });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          sound.setPositionAsync(0);
        }
      });
    }
    await soundRef.current.playAsync();
    setIsPlaying(true);
  };

  const handleSave = async () => {
    if (saving || !isDirty) return;
    if (!title.trim()) {
      setSaveError('Give your story a title before saving');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await storiesApi.update(story.id, {
        title: title.trim(),
        description: description.trim() || undefined,
      });
      setSavedTitle(title.trim());
      setSavedDescription(description.trim());
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await storiesApi.remove(story.id);
      setDeleteVisible(false);
      onDeleted?.();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const duration = formatDuration(story.mediaDurationMillis);

  return (
    <View style={s.safeArea}>
      <StatusBar style="dark" />

      <Header title="Review Story" showBack onBackPress={onBack} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.section}>
          <Text style={s.sectionLabel}>Title</Text>
          <TextInput
            style={s.input}
            placeholder="Give your story a title"
            placeholderTextColor={D.onSurfaceVariant}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>Description</Text>
          <TextInput
            style={[s.input, s.textarea]}
            placeholder="Add a little context for this story…"
            placeholderTextColor={D.onSurfaceVariant}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>

        {story.mediaUrl && story.mediaType === 'VIDEO' && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Video</Text>
            <Video
              source={{ uri: getMediaUrl(story.mediaUrl) }}
              style={s.videoPlayer}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              isLooping={false}
            />
          </View>
        )}

        {story.mediaUrl && story.mediaType === 'AUDIO' && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Voice recording</Text>
            <View style={s.clipCard}>
              <RoundIconButton
                icon={isPlaying ? Pause : Play}
                size={48}
                color={D.onSecondaryContainer}
                backgroundColor={D.secondaryContainer}
                onPress={toggleAudioPlayback}
                accessibilityLabel={isPlaying ? 'Pause playback' : 'Play recording'}
              />
              <View style={{ flex: 1 }}>
                <Text style={s.clipTitle}>Your voice recording</Text>
                {!!duration && <Text style={s.clipMeta}>{duration}</Text>}
              </View>
            </View>
          </View>
        )}

        {!!saveError && <Text style={s.errorText}>{saveError}</Text>}
        {!!deleteError && <Text style={s.errorText}>{deleteError}</Text>}
      </ScrollView>

      <View style={s.actionBar}>
        <Pressable
          onPress={handleSave}
          disabled={!isDirty || saving}
          style={({ pressed }) => [
            s.saveBtn,
            (!isDirty || saving) && s.saveBtnDisabled,
            pressed && isDirty && !saving && s.pressed,
          ]}
          accessibilityRole="button"
        >
          <Text style={[s.saveBtnText, (!isDirty || saving) && s.saveBtnTextDisabled]}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => !deleting && setDeleteVisible(true)}
          style={({ pressed }) => [s.deleteBtn, pressed && s.pressed]}
          accessibilityRole="button"
        >
          <Trash2 size={18} color="#ba1a1a" strokeWidth={2} />
          <Text style={s.deleteBtnText}>Delete Content</Text>
        </Pressable>
      </View>

      <UserFooter activeTab="home" onTabSelect={(tab) => onTabPress?.(tab)} />

      <ConfirmDialog
        visible={deleteVisible}
        title="Delete this story?"
        message="This can't be undone — the recording and details will be permanently removed."
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        cancelLabel="Cancel"
        onCancel={() => !deleting && setDeleteVisible(false)}
        onConfirm={handleDelete}
      />
    </View>
  );
};

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },

  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
  },

  section: { gap: Spacing.sm },
  sectionLabel: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: D.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: D.onSurface,
    minHeight: 48,
  },
  textarea: { minHeight: 100 },

  videoPlayer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Radii.xl,
    backgroundColor: '#000',
  },

  clipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(15,92,92,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,92,92,0.18)',
    borderRadius: Radii.xl,
    padding: Spacing.md,
  },
  clipTitle: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeMD, color: D.onSurface },
  clipMeta: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant, marginTop: 2 },

  errorText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: '#ba1a1a',
    textAlign: 'center',
  },

  actionBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: D.outlineVariant,
    backgroundColor: D.surfaceContainerLowest,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: Radii.lg,
    backgroundColor: D.primaryContainer,
  },
  saveBtnDisabled: { backgroundColor: D.surfaceContainer },
  saveBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.onPrimary },
  saveBtnTextDisabled: { color: D.onSurfaceVariant },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(186,26,26,0.35)',
    backgroundColor: 'rgba(186,26,26,0.06)',
  },
  deleteBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: '#ba1a1a' },

  pressed: { opacity: 0.85 },
});

export default StoryReview;
