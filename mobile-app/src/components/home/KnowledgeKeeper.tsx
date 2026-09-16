import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Share, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from './KnowledgeKeeper.styles';
import { playActionSound } from '../../utils/soundEffects';

export interface KnowledgeKeeperProps {
  name: string;
  title: string;
  tag: string;
  quote: string;
  avatarUrl: string;
  likesCount?: number;
}

export const KnowledgeKeeper: React.FC<KnowledgeKeeperProps> = ({
  name,
  title,
  tag,
  quote,
  avatarUrl,
  likesCount: initialLikesCount = 892,
}) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const heartScale = useRef(new Animated.Value(1)).current;
  const shareScale = useRef(new Animated.Value(1)).current;
  const saveTranslateY = useRef(new Animated.Value(0)).current;

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    if (newLiked) {
      playActionSound('like');
      setLikesCount(likesCount + 1);
      Animated.sequence([
        Animated.timing(heartScale, { toValue: 1.4, duration: 100, useNativeDriver: true }),
        Animated.spring(heartScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true })
      ]).start();
    } else {
      setLikesCount(likesCount - 1);
    }
  };

  const handleSave = () => {
    const newSaved = !saved;
    setSaved(newSaved);
    if (newSaved) playActionSound('save');
  };

  const handleShare = async () => {
    try {
      playActionSound('share');
      await Share.share({
        message: `Meet the Knowledge Keeper: ${name}, ${title}.\n"${quote}"\n\nShared via LegacyLens`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.knowledgeCard}>
        <View style={styles.knowledgeGlowTop} />
        <View style={styles.knowledgeGlowBottom} />
        
        <View style={styles.knowledgeCardHeader}>
          <View style={styles.knowledgeBadge}>
            <MaterialIcons name="auto-awesome" size={16} color="#fe893e" />
            <Text style={styles.knowledgeBadgeText}>MEET THE KNOWLEDGE KEEPER</Text>
          </View>
        </View>

        <View style={styles.knowledgeProfileRow}>
          <Image 
            source={{ uri: avatarUrl }} 
            style={styles.knowledgeAvatar} 
          />
          <View style={styles.knowledgeInfo}>
            <Text style={styles.knowledgeName}>{name}</Text>
            <Text style={styles.knowledgeTitle}>{title}</Text>
            <View style={styles.knowledgeTag}>
              <Text style={styles.knowledgeTagText}>{tag}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.knowledgeQuote}>
          "{quote}"
        </Text>

        <View style={styles.knowledgeFooter}>
          <View style={{ flexDirection: 'row', gap: 20 }}>
            <TouchableOpacity onPress={handleLike} activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <MaterialIcons name={liked ? "favorite" : "favorite-border"} size={26} color={liked ? "#FF4B4B" : "#ACEEEE"} />
              </Animated.View>
              <Text style={[styles.knowledgeActionText, liked && { color: "#FF4B4B" }]}>{likesCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Animated.View style={{ transform: [{ scale: shareScale }] }}>
                <MaterialIcons name="share" size={26} color="#ACEEEE" />
              </Animated.View>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleSave} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Animated.View style={{ transform: [{ translateY: saveTranslateY }] }}>
              <MaterialIcons name={saved ? "bookmark" : "bookmark-border"} size={26} color={saved ? "#fe893e" : "#ACEEEE"} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};


