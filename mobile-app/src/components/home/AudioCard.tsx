import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { styles } from './AudioCard.styles';

const TOTAL_BARS = 30; // number of waveform bars rendered

export const AudioCard = ({
  a,
  item,
  setActivePostId,
  setCommentModalVisible,
}: {
  a: any;
  item: any;
  setActivePostId: (id: string) => void;
  setCommentModalVisible: (v: boolean) => void;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 … TOTAL_BARS

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && progress < TOTAL_BARS) {
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= TOTAL_BARS) {
            setIsPlaying(false);
            return TOTAL_BARS;
          }
          return p + 1;
        });
      }, 600);
    }
    return () => clearInterval(interval);
  }, [isPlaying, progress]);

  const handlePlayPause = () => {
    if (progress >= TOTAL_BARS) {
      // Replay from start
      setProgress(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(prev => !prev);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.authorRow}>
          <Image source={{ uri: a.avatar }} style={styles.avatar} />
          <View>
            <Text style={styles.authorName}>{a.name}</Text>
            <Text style={styles.timeAgo}>{a.location}</Text>
          </View>
        </View>
        <View style={styles.audioBadge}>
          <MaterialIcons name="mic" size={13} color={Colors.secondary} />
          <Text style={styles.audioBadgeText}>Audio</Text>
        </View>
      </View>

      {a.topic ? <Text style={styles.audioTopic}>{a.topic}</Text> : null}

      {/* ── Audio strip inside green box — full width, flex bars ── */}
      <View style={styles.audioStrip}>
        {/* Play / Pause button */}
        <TouchableOpacity
          onPress={handlePlayPause}
          activeOpacity={0.8}
          style={styles.audioPlayBtn}
        >
          <MaterialIcons
            name={isPlaying ? 'pause' : 'play-arrow'}
            size={26}
            color={Colors.white}
          />
        </TouchableOpacity>

        {/* Waveform — always TOTAL_BARS, each bar flex:1 to fill width */}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', height: 40, gap: 2 }}>
          {Array.from({ length: TOTAL_BARS }, (_, i) => {
            const src = a.bars && a.bars.length > 0 ? a.bars : [2,3,4,5,3,2,4,5,3,2];
            const h = src[i % src.length] as number;
            return (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: Math.max(6, h * 5),
                  borderRadius: 2,
                  backgroundColor: i < progress ? '#fe893e' : 'rgba(255,255,255,0.4)',
                }}
              />
            );
          })}
        </View>
        
        <Text style={styles.audioDurationText}>{a.duration}</Text>
      </View>
    </View>
  );
};
