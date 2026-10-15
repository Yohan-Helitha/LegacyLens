import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Share } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Colors } from '../../theme';
import { styles } from './VideoCard.styles';

import { homeApi } from '../../services/api/homeApi';
import { userLikesStorage } from '../../utils/userLikesStorage';

interface FeedCardActionsProps {
  postId?: string;
  initialLikes: number;
  initialComments: number;
  initialLiked?: boolean;
  onLikePress?: () => void;
  onLikeChange?: (postId: string, newLikesCount: number, liked: boolean) => void;
  onCommentPress: () => void;
  theme?: 'light' | 'dark';
}

export const FeedCardActions = ({
  postId,
  initialLikes,
  initialComments,
  initialLiked,
  onLikePress,
  onLikeChange,
  onCommentPress,
  theme = 'light'
}: FeedCardActionsProps) => {
  const [liked, setLiked] = useState(() => {
    if (initialLiked !== undefined && initialLiked !== null) {
      return Boolean(initialLiked);
    }
    return postId ? userLikesStorage.isLikedSync(postId) : false;
  });
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes ?? 0);
  const [commentsCount, setCommentsCount] = useState(initialComments ?? 0);

  useEffect(() => {
    if (initialLiked !== undefined && initialLiked !== null) {
      const isL = Boolean(initialLiked);
      setLiked(isL);
      if (postId && isL) {
        userLikesStorage.setLiked(postId, true);
      }
    }
  }, [initialLiked, postId]);

  useEffect(() => {
    if (!postId) return;
    let isMounted = true;
    userLikesStorage.isLiked(postId).then((isL) => {
      if (isMounted) {
        if (isL) {
          setLiked(true);
        } else if (initialLiked === undefined || initialLiked === null) {
          setLiked(false);
        }
      }
    });
    const unsubscribe = userLikesStorage.subscribe((id, isL) => {
      if (isMounted && id === String(postId)) {
        setLiked(isL);
      }
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [postId, initialLiked]);

  useEffect(() => {
    if (initialComments !== undefined && initialComments !== null) {
      setCommentsCount(initialComments);
    }
  }, [initialComments]);

  useEffect(() => {
    if (initialLikes !== undefined && initialLikes !== null) {
      setLikesCount(initialLikes);
    }
  }, [initialLikes]);

  const heartScale = useRef(new Animated.Value(1)).current;
  const saveTranslateY = useRef(new Animated.Value(0)).current;
  const shareScale = useRef(new Animated.Value(1)).current;

  const likePlayer = useAudioPlayer(require('../../../assets/sounds/heart.mp3'));
  const savePlayer = useAudioPlayer({ uri: 'https://www.soundjay.com/buttons/sounds/button-30.mp3' });
  const sharePlayer = useAudioPlayer({ uri: 'https://www.soundjay.com/buttons/sounds/button-10.mp3' });

  const playSound = async (type: 'like' | 'save' | 'share') => {
    try {
      await setAudioModeAsync({ playsInSilentMode: true });
      if (type === 'like') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        likePlayer.seekTo(0);
        likePlayer.play();
      } else if (type === 'save') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        savePlayer.seekTo(0);
        savePlayer.play();
      } else if (type === 'share') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        sharePlayer.seekTo(0);
        sharePlayer.play();
      }
    } catch (e) {
      console.log('Error playing sound:', e);
    }
  };

  const handleLike = async () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    if (postId) {
      userLikesStorage.setLiked(postId, nextLiked);
    }

    if (nextLiked) {
      playSound('like');
      const optimisticCount = likesCount + 1;
      setLikesCount(optimisticCount);

      Animated.sequence([
        Animated.timing(heartScale, { toValue: 1.25, duration: 100, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
        Animated.spring(heartScale, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true })
      ]).start();

      if (onLikePress) onLikePress();

      if (postId) {
        try {
          const dbLikes = await homeApi.likePost(postId);
          if (typeof dbLikes === 'number') {
            setLikesCount(dbLikes);
            onLikeChange?.(postId, dbLikes, true);
          }
        } catch (err) {
          console.log('Error saving like to DB:', err);
        }
      }
    } else {
      const optimisticCount = Math.max(0, likesCount - 1);
      setLikesCount(optimisticCount);

      if (postId) {
        try {
          const dbLikes = await homeApi.unlikePost(postId);
          if (typeof dbLikes === 'number') {
            setLikesCount(dbLikes);
            onLikeChange?.(postId, dbLikes, false);
          }
        } catch (err) {
          console.log('Error saving unlike to DB:', err);
        }
      }
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
