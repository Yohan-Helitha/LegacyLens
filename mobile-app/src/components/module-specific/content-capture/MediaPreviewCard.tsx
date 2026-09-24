import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Audio, ResizeMode, Video } from 'expo-av';
import { Pause, Play } from 'lucide-react-native';
import { RoundIconButton } from '../../common';
import { Typography, Spacing, Radii } from '../../../theme';
import { ContentCaptureColors as D } from './tokens';
import type { StoryMediaType } from '../../../types/story';

interface MediaPreviewCardProps {
  mediaType: StoryMediaType;
  uri: string;
  durationMillis?: number;
  /** Omit (or set false) for the read-only variant — no Re-record button. */
  onRerecord?: () => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** Playback + optional re-record affordance for an already-captured clip — used by ContentFormScreen for both AUDIO and VIDEO content. */
export const MediaPreviewCard: React.FC<MediaPreviewCardProps> = ({
  mediaType,
  uri,
  durationMillis = 0,
  onRerecord,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, [uri]);

  const toggleAudioPlayback = async () => {
    if (isPlaying) {
      await soundRef.current?.pauseAsync();
      setIsPlaying(false);
      return;
    }
    if (!soundRef.current) {
      const { sound } = await Audio.Sound.createAsync({ uri });
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

  if (mediaType === 'VIDEO') {
    return (
      <View style={{ gap: Spacing.sm }}>
        <Video
          source={{ uri }}
          style={s.videoPlayer}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
          isLooping={false}
        />
        <View style={s.metaRow}>
          <Text style={s.metaText}>{formatDuration(durationMillis)}</Text>
          {!!onRerecord && (
            <Pressable
              onPress={onRerecord}
              style={({ pressed }) => [s.rerecordBtn, pressed && s.pressed]}
              accessibilityRole="button"
            >
              <Text style={s.rerecordText}>Re-record</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={s.card}>
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
        <Text style={s.metaText}>{formatDuration(durationMillis)}</Text>
      </View>
      {!!onRerecord && (
        <Pressable
          onPress={onRerecord}
          style={({ pressed }) => [s.rerecordBtnCircle, pressed && s.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Re-record"
        >
          <Text style={s.rerecordText}>Re-record</Text>
        </Pressable>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  card: {
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
  metaText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant, marginTop: 2 },

  videoPlayer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Radii.xl,
    backgroundColor: '#000',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  rerecordBtn: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, minHeight: 44, justifyContent: 'center' },
  rerecordBtnCircle: { paddingHorizontal: Spacing.sm, minHeight: 44, justifyContent: 'center' },
  rerecordText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.primary },

  pressed: { opacity: 0.75 },
});

export default MediaPreviewCard;
