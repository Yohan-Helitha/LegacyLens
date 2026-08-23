import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import { Mic, Pause, Play, RotateCcw } from 'lucide-react-native';
import { BackButton, ConfirmDialog } from '../../components/common';
import { RoundIconButton } from '../../components/common';
import { RecordingActionButtons, ContentCaptureColors as D } from '../../components/module-specific/content-capture';
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
  onBack?: () => void;
  /** User confirmed they want to throw the draft away */
  onDiscard?: () => void;
  /** User wants to redo the recording — clip will be replaced */
  onRerecord?: () => void;
  onSave?: (draft: StoryDraft) => void;
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
  onBack,
  onDiscard,
  onRerecord,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [discardVisible, setDiscardVisible] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const togglePlayback = async () => {
    if (!clip) return;

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

  const handleSave = () => {
    onSave?.({ title, description, clip });
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
          <Text style={s.sectionLabel}>Voice recording</Text>
          {clip ? (
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
                <Text style={s.clipTitle}>Your voice recording</Text>
                <Text style={s.clipMeta}>{formatDuration(clip.durationMillis)}</Text>
              </View>
              <Pressable
                onPress={handleRerecord}
                style={({ pressed }) => [s.rerecordBtn, pressed && s.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Re-record"
              >
                <RotateCcw size={18} color={D.primary} strokeWidth={2} />
              </Pressable>
            </View>
          ) : (
            <View style={s.emptyClip}>
              <Mic size={22} color={D.onSurfaceVariant} strokeWidth={2} />
              <Text style={s.emptyClipText}>No recording attached</Text>
            </View>
          )}
        </View>

        <View style={{ flex: 1 }} />

        <RecordingActionButtons
          startOverLabel="Discard"
          finishLabel="Save Story"
          onStartOverPress={() => setDiscardVisible(true)}
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
});

export default StoryDetails;
