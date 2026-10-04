import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Audio } from 'expo-av';
import { Mic, Pause, Play } from 'lucide-react-native';
import { getMediaUrl } from '../../constants/api';
import { Typography } from '../../theme';
import { MessagingColors as D } from './messagingTheme';

/**
 * A voice note inside a chat bubble — tap to play/pause. Loads the clip only
 * on first tap (same expo-av approach as MediaPreviewCard) and unloads it when
 * the bubble leaves the screen.
 */
export const VoiceNoteBubble: React.FC<{ mediaUrl: string; fromMe: boolean }> = ({ mediaUrl, fromMe }) => {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => () => {
    soundRef.current?.unloadAsync().catch(() => undefined);
  }, []);

  const toggle = async () => {
    try {
      if (!soundRef.current) {
        setLoading(true);
        const { sound } = await Audio.Sound.createAsync({ uri: getMediaUrl(mediaUrl) });
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlaying(false);
            sound.setPositionAsync(0).catch(() => undefined);
          }
        });
        soundRef.current = sound;
        setLoading(false);
      }
      if (playing) {
        await soundRef.current.pauseAsync();
        setPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setPlaying(true);
      }
    } catch {
      setLoading(false);
      setFailed(true);
    }
  };

  const tint = fromMe ? '#ffffff' : D.primary;

  return (
    <Pressable
      onPress={toggle}
      disabled={loading || failed}
      style={s.row}
      accessibilityRole="button"
      accessibilityLabel={playing ? 'Pause voice message' : 'Play voice message'}
    >
      <View style={[s.playBtn, { borderColor: tint }]}>
        {loading ? (
          <ActivityIndicator size="small" color={tint} />
        ) : playing ? (
          <Pause size={18} color={tint} strokeWidth={2.25} />
        ) : (
          <Play size={18} color={tint} strokeWidth={2.25} />
        )}
      </View>
      <Mic size={16} color={tint} strokeWidth={2} />
      <Text style={[s.label, { color: tint }]}>{failed ? "Couldn't play" : 'Voice message'}</Text>
    </Pressable>
  );
};

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 40 },
  playBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM },
});

export default VoiceNoteBubble;
