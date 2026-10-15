import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Colors } from '../../theme';
import { styles } from './AudioCard.styles';
import { FeedCardActions } from './FeedCardActions';
import { apiPost } from '../../services/api/client';
import { getMediaUrl } from '../../constants/api';
import { AvatarPlaceholder } from '../common/AvatarPlaceholder';

const TOTAL_BARS = 30; // number of waveform bars rendered

function formatTime(millis: number): string {
  if (!millis || millis <= 0) return '0:00';
  const totalSeconds = Math.floor(millis / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const AudioCard = ({
  a,
  item,
  setActivePostId,
  setCommentModalVisible,
  onLikeChange,
  initialLiked,
}: {
  a: any;
  item: any;
  setActivePostId: (id: string) => void;
  setCommentModalVisible: (v: boolean) => void;
  onLikeChange?: (postId: string, newLikesCount: number, liked: boolean) => void;
  initialLiked?: boolean;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0); // 0 … TOTAL_BARS
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [hasRecordedView, setHasRecordedView] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);

  const rawUrl = a?.mediaUrl || item?.mediaUrl;
  const audioUri = rawUrl ? getMediaUrl(rawUrl) : null;

  // Unload sound when unmounting
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.warn(`Audio playback error: ${status.error}`);
        setIsPlaying(false);
        setIsLoading(false);
      }
      return;
    }

    setIsPlaying(status.isPlaying);
    setPositionMillis(status.positionMillis);

    if (status.durationMillis && status.durationMillis > 0) {
      setDurationMillis(status.durationMillis);
      const ratio = status.positionMillis / status.durationMillis;
      setProgress(Math.min(TOTAL_BARS, Math.floor(ratio * TOTAL_BARS)));
    }

    if (status.didJustFinish) {
      setIsPlaying(false);
      setProgress(0);
      setPositionMillis(0);
      soundRef.current?.setPositionAsync(0).catch(() => {});
    }
  };

  const handlePlayPause = async () => {
    const storyId = a?.id || item?.id;
    if (!hasRecordedView && storyId) {
      setHasRecordedView(true);
      apiPost(`/stories/${storyId}/view`, {}).catch(() => {});
    }

    // If we have a sound already loaded
    if (soundRef.current) {
      try {
        if (isPlaying) {
          await soundRef.current.pauseAsync();
        } else {
          await soundRef.current.playAsync();
        }
      } catch (err) {
        console.warn('Error toggling audio playback', err);
      }
      return;
    }

    // First time loading sound
    if (audioUri) {
      try {
        setIsLoading(true);
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        }).catch(() => {});

        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        soundRef.current = sound;
        setIsLoading(false);
      } catch (err) {
        console.warn('Failed to load audio sound', err);
        setIsLoading(false);
      }
    } else {
      // Fallback simulation if no audio URL available
      setIsPlaying(prev => !prev);
    }
  };

  // Allow scrubbing/seeking by tapping waveform
  const handleSeek = async (barIndex: number) => {
    const targetRatio = barIndex / TOTAL_BARS;
    setProgress(barIndex);
    if (soundRef.current && durationMillis > 0) {
      const targetPos = Math.floor(targetRatio * durationMillis);
      await soundRef.current.setPositionAsync(targetPos).catch(() => {});
    }
  };

  const formattedDisplayTime = durationMillis > 0 && positionMillis > 0
    ? `${formatTime(positionMillis)} / ${formatTime(durationMillis)}`
    : (a?.duration || (durationMillis > 0 ? formatTime(durationMillis) : '0:30'));

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.authorRow}>
          <AvatarPlaceholder
            name={a?.name || a?.author || item?.author}
            avatarUrl={a?.avatar || item?.avatar}
            size={40}
            theme="light"
          />
          <View>
            <Text style={styles.authorName}>{a?.name || a?.author || item?.author || 'Heritage Contributor'}</Text>
            <Text style={styles.timeAgo}>{a?.location || item?.location || 'Sri Lanka'}</Text>
          </View>
        </View>
        <View style={styles.audioBadge}>
          <MaterialIcons name="mic" size={13} color={Colors.secondary} />
          <Text style={styles.audioBadgeText}>Audio</Text>
        </View>
      </View>

      {a?.topic || a?.title || item?.title ? (
        <Text style={styles.audioTopic}>{a?.topic || a?.title || item?.title}</Text>
      ) : null}

      {/* ── Audio strip inside green box — full width, flex bars ── */}
      <View style={styles.audioStrip}>
        {/* Play / Pause button */}
        <TouchableOpacity
          onPress={handlePlayPause}
          disabled={isLoading}
          activeOpacity={0.8}
          style={styles.audioPlayBtn}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <MaterialIcons
              name={isPlaying ? 'pause' : 'play-arrow'}
              size={26}
              color={Colors.white}
            />
          )}
        </TouchableOpacity>

        {/* Waveform — always TOTAL_BARS, each bar flex:1 to fill width */}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', height: 40, gap: 2 }}>
          {Array.from({ length: TOTAL_BARS }, (_, i) => {
            const src = a?.bars && a?.bars.length > 0 ? a.bars : [20, 30, 40, 50, 30, 20, 40, 50, 30, 20];
            const h = src[i % src.length] as number;
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                onPress={() => handleSeek(i)}
                style={{
                  flex: 1,
                  height: Math.max(6, (h / 100) * 36),
                  borderRadius: 2,
                  backgroundColor: i < progress ? '#fe893e' : 'rgba(255,255,255,0.4)',
                }}
              />
            );
          })}
        </View>
        
        <Text style={styles.audioDurationText}>{formattedDisplayTime}</Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <FeedCardActions
          postId={item?.id || a?.id}
          theme="light"
          initialLikes={a?.likesCount ?? item?.likesCount ?? 0}
          initialComments={a?.commentsCount ?? item?.commentsCount ?? 0}
          initialLiked={initialLiked ?? item?.liked ?? a?.liked ?? false}
          onLikeChange={onLikeChange}
          onCommentPress={() => {
            setActivePostId(item?.id || a?.id);
            setCommentModalVisible(true);
          }}
        />
      </View>
    </View>
  );
};
