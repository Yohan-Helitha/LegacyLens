import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Audio, ResizeMode, Video } from 'expo-av';
import { Mic, Pause, Play, RotateCcw, Trash2, Upload } from 'lucide-react-native';
import { BackButton, ConfirmDialog } from '../../components/common';
import { RoundIconButton } from '../../components/common';
import { RecordingActionButtons, ContentCaptureColors as D } from '../../components/module-specific/content-capture';
import { ApiError } from '../../services/api/client';
import { Typography, Spacing, Radii } from '../../theme';
import type { RecordedClip } from './record_capture';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface StoryDraft {
  title: string;
  description: string;
  clip: RecordedClip | null;
}

interface StoryDetailsProps {
  clip: RecordedClip | null;
  /** Where the clip came from — changes the copy in the media section only */
  clipSource?: 'recorded' | 'uploaded';
  onBack?: () => void;
  /** User confirmed they want to throw the draft away */
  onDiscard?: () => void;
  /** User wants to redo the recording, or pick a different file — clip will be replaced */
  onRerecord?: () => void;
  /** User cleared the attached clip without immediately picking a replacement */
  onRemoveClip?: () => void;
  /** User tapped "Upload a file" from the empty state — picks an audio/video file from the device */
  onPickMedia?: () => void;
  /** Saves the story. Throw to show the error and let the user retry. */
  onSave?: (draft: StoryDraft) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const StoryDetails: React.FC<StoryDetailsProps> = ({
  clip,
  clipSource = 'recorded',
  onBack,
  onDiscard,
  onRerecord,
  onRemoveClip,
  onPickMedia,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [discardVisible, setDiscardVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const togglePlayback = async () => {
    if (!clip || clip.kind === 'video') return;

    if (isPlaying) {
      await soundRef.current?.pauseAsync();
      setIsPlaying(false);
      return;
    }

    if (!soundRef.current) {
      const { sound } = await Audio.Sound.createAsync({ uri: clip.uri });
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

  const handleRerecord = async () => {
    await soundRef.current?.unloadAsync().catch(() => {});
    soundRef.current = null;
    setIsPlaying(false);
    onRerecord?.();
  };

  const handleSave = async () => {
    if (submitting) return;

    if (!title.trim()) {
      setSaveError('Give your story a title before saving');
      return;
    }

    setSubmitting(true);
    setSaveError(null);
    try {
      await onSave?.({ title: title.trim(), description: description.trim(), clip });
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={s.topBar}>
        <BackButton onPress={onBack} />
      </View>

      <View style={s.content}>
        <View style={s.heading}>
          <Text style={s.headline}>Review your story</Text>
          <Text style={s.subheadline}>Give it a title and a little context</Text>
        </View>

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

        <View style={s.section}>
          <Text style={s.sectionLabel}>
            {clip ? (clip.kind === 'video' ? 'Video' : 'Voice recording') : 'Voice recording or video'}
          </Text>
          {clip ? (
            clip.kind === 'video' ? (
              <View style={{ gap: Spacing.sm }}>
                <Video
                  source={{ uri: clip.uri }}
                  style={s.videoPlayer}
                  resizeMode={ResizeMode.CONTAIN}
                  useNativeControls
                  isLooping={false}
                />
                <View style={s.clipMetaRow}>
                  <Text style={s.clipMeta}>{formatDuration(clip.durationMillis)}</Text>
                  <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                    <Pressable
                      onPress={handleRerecord}
                      style={({ pressed }) => [s.clipIconBtn, pressed && s.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel={clipSource === 'uploaded' ? 'Choose a different file' : 'Retry'}
                    >
                      <RotateCcw size={18} color={D.primary} strokeWidth={2} />
                    </Pressable>
                    <Pressable
                      onPress={onRemoveClip}
                      style={({ pressed }) => [s.clipIconBtn, pressed && s.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel="Remove video"
                    >
                      <Trash2 size={18} color="#ba1a1a" strokeWidth={2} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : (
              <View style={s.clipCard}>
                <RoundIconButton
                  icon={isPlaying ? Pause : Play}
                  size={48}
                  color={D.onSecondaryContainer}
                  backgroundColor={D.secondaryContainer}
                  onPress={togglePlayback}
                  accessibilityLabel={isPlaying ? 'Pause playback' : 'Play recording'}
                />
                <View style={{ flex: 1 }}>
                  <Text style={s.clipTitle}>
                    {clipSource === 'uploaded' ? 'Uploaded audio' : 'Your voice recording'}
                  </Text>
                  <Text style={s.clipMeta}>{formatDuration(clip.durationMillis)}</Text>
                </View>
                <Pressable
                  onPress={handleRerecord}
                  style={({ pressed }) => [s.rerecordBtn, pressed && s.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={clipSource === 'uploaded' ? 'Choose a different file' : 'Re-record'}
                >
                  <RotateCcw size={18} color={D.primary} strokeWidth={2} />
                </Pressable>
                <Pressable
                  onPress={onRemoveClip}
                  style={({ pressed }) => [s.rerecordBtn, pressed && s.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Remove recording"
                >
                  <Trash2 size={18} color="#ba1a1a" strokeWidth={2} />
                </Pressable>
              </View>
            )
          ) : clipSource === 'uploaded' ? (
            <Pressable
              onPress={onPickMedia}
              style={({ pressed }) => [s.uploadClip, pressed && s.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Upload an audio or video file"
            >
              <Upload size={22} color={D.primary} strokeWidth={2} />
              <Text style={s.uploadClipText}>Upload audio or video</Text>
            </Pressable>
          ) : (
            <View style={s.emptyClip}>
              <Mic size={22} color={D.onSurfaceVariant} strokeWidth={2} />
              <Text style={s.emptyClipText}>No recording attached</Text>
            </View>
          )}
        </View>

        <View style={{ flex: 1 }} />

        {!!saveError && <Text style={s.saveErrorText}>{saveError}</Text>}

        <RecordingActionButtons
          startOverLabel="Discard"
          finishLabel={submitting ? 'Saving…' : 'Save Story'}
          onStartOverPress={() => !submitting && setDiscardVisible(true)}
          onFinishPress={handleSave}
        />
      </View>

      <ConfirmDialog
        visible={discardVisible}
        title="Discard this story?"
        message="Your recording and anything you've written here will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onCancel={() => setDiscardVisible(false)}
        onConfirm={() => {
          setDiscardVisible(false);
          onDiscard?.();
        }}
      />
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },

  topBar: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },

  content: { flex: 1, padding: Spacing.md, gap: Spacing.lg },

  heading: { gap: 2, marginBottom: Spacing.xs },
  headline: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    color: D.onSurface,
  },
  subheadline: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: D.onSurfaceVariant,
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
  clipTitle: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeMD,
    color: D.onSurface,
  },
  clipMeta: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
    marginTop: 2,
  },
  rerecordBtn: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: D.surfaceContainer,
  },

  videoPlayer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Radii.xl,
    backgroundColor: '#000',
  },
  clipMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clipIconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: D.surfaceContainer,
  },

  uploadClip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,92,92,0.3)',
    borderStyle: 'dashed',
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    backgroundColor: 'rgba(15,92,92,0.05)',
  },
  uploadClipText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: D.primary,
  },

  emptyClip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    borderStyle: 'dashed',
    borderRadius: Radii.xl,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  emptyClipText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
  },

  pressed: { opacity: 0.75 },

  saveErrorText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: '#ba1a1a',
    textAlign: 'center',
  },
});

export default StoryDetails;
