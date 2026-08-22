import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Share } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { Colors } from '../../theme';
import { styles } from './VideoCard.styles';

interface FeedCardActionsProps {
  initialLikes: number;
  initialComments: number;
  onCommentPress: () => void;
  theme?: 'light' | 'dark';
}

export const FeedCardActions = ({ initialLikes, initialComments, onCommentPress, theme = 'light' }: FeedCardActionsProps) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [commentsCount] = useState(initialComments);
  const heartScale = useRef(new Animated.Value(1)).current;
  const saveTranslateY = useRef(new Animated.Value(0)).current;
  const shareScale = useRef(new Animated.Value(1)).current;

  const playSound = async (type: 'like' | 'save' | 'share') => {
    try {
      let source: any;
      if (type === 'like') {
        source = require('../../../assets/sounds/heart.mp3');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else if (type === 'save') {
        source = { uri: 'https://www.soundjay.com/buttons/sounds/button-30.mp3' };
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (type === 'share') {
        source = { uri: 'https://www.soundjay.com/buttons/sounds/button-10.mp3' };
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: true });
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (e) {
      console.log('Error playing sound:', e);
    }
  };

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    if (newLiked) {
      playSound('like');
      setLikesCount(likesCount + 1);
      Animated.sequence([
        Animated.timing(heartScale, { toValue: 1.25, duration: 100, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
        Animated.spring(heartScale, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true })
      ]).start();
    } else {
      setLikesCount(likesCount - 1);
    }
  };

  const handleSave = () => {
    const newSaved = !saved;
    setSaved(newSaved);
    if (newSaved) {
      playSound('save');
      saveTranslateY.setValue(-8);
      Animated.spring(saveTranslateY, { toValue: 0, friction: 4, tension: 40, useNativeDriver: true }).start();
    }
  };

  const handleShare = async () => {
    try {
      playSound('share');
      Animated.sequence([
        Animated.timing(shareScale, { toValue: 1.15, duration: 100, useNativeDriver: true }),
        Animated.timing(shareScale, { toValue: 1, duration: 100, useNativeDriver: true })
      ]).start();
      await Share.share({
        message: 'Check out this post on LegacyLens! https://legacylens.app/post/share',
      });
    } catch (error) {
      console.error(error);
    }
  };

  const isDark = theme === 'dark';
  const iconColor = isDark ? '#d1dbdb' : Colors.textMuted;
  const textColor = isDark ? '#d1dbdb' : Colors.textMuted;

  return (
    <View style={[styles.cardActions, isDark && { borderTopColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 0, paddingBottom: 0, marginTop: 16 }]}>
      <View style={styles.leftActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.8}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons name={liked ? "heart" : "heart-outline"} size={28} color={liked ? "#FF4B4B" : iconColor} />
          </Animated.View>
          <Text style={[styles.actionCount, { color: textColor }, liked && { color: "#FF4B4B", fontWeight: '600' }]}>{likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onCommentPress}>
          <MaterialIcons name="chat-bubble-outline" size={26} color={iconColor} />
          <Text style={[styles.actionCount, { color: textColor }]}>{commentsCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Animated.View style={{ transform: [{ scale: shareScale }] }}>
            <MaterialIcons name="share" size={26} color={iconColor} />
          </Animated.View>
          <Text style={[styles.actionCount, { color: textColor }]}>Share</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
        <Animated.View style={{ transform: [{ translateY: saveTranslateY }] }}>
          <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={28} color={saved ? "#fe893e" : iconColor} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};
