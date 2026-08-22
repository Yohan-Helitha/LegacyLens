import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { styles } from './VideoCard.styles';
import { FeedCardActions } from './FeedCardActions';
import { VideoLoader } from './VideoLoader';

export const VideoCard = ({ v, isPlaying, item, setActivePostId, setCommentModalVisible, onNavigate, loadedVideoIds }: any) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(() => loadedVideoIds?.has?.(v.id) ?? false);
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isReady) {
      timer = setTimeout(() => setShowLoader(true), 500);
    } else {
      setShowLoader(false);
    }
    return () => clearTimeout(timer);
  }, [isReady]);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onNavigate?.('video')} style={styles.premiumCard}>
      <View style={styles.premiumHeroBox}>
        {(showLoader && !isReady) ? <VideoLoader /> : null}
        <Video
          source={{ uri: v.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4' }}
          style={[styles.premiumHeroImg, !isReady && { opacity: 0 }]}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isPlaying}
          isLooping
          isMuted={isMuted}
          useNativeControls={false}
          onReadyForDisplay={() => {
            setIsReady(true);
            loadedVideoIds?.add?.(v.id);
          }}
          onLoadStart={() => {
            if (!loadedVideoIds?.has?.(v.id)) setIsReady(false);
          }}
        />
        <View style={styles.premiumBadge}>
          <MaterialIcons name="play-circle-outline" size={14} color="#fff" />
          <Text style={styles.premiumBadgeText}>WATCH VIDEO</Text>
        </View>
        <TouchableOpacity
          style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 16 }}
          onPress={() => setIsMuted(!isMuted)}
        >
          <MaterialIcons name={isMuted ? 'volume-off' : 'volume-up'} size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.premiumContent}>
        <Text style={styles.premiumTitle} numberOfLines={2}>{v.title}</Text>
        <Text style={styles.premiumDesc} numberOfLines={2}>Explore the deep traditions and cultural significance of Sri Lankan heritage.</Text>
        <View style={styles.premiumDivider} />
        <View style={styles.premiumFooter}>
          <View style={styles.premiumAuthorBox}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200' }} style={styles.premiumAvatar} />
            <View>
              <Text style={styles.premiumAuthorName}>{v.author}</Text>
              <Text style={styles.premiumAuthorSub}>{'Video · ' + (v.duration || '')}</Text>
            </View>
          </View>
        </View>

        <FeedCardActions
          theme="dark"
          initialLikes={Math.floor(Math.random() * 500) + 20}
          initialComments={Math.floor(Math.random() * 100) + 5}
          onCommentPress={() => {
            setActivePostId(item.id);
            setCommentModalVisible(true);
          }}
        />
      </View>
    </TouchableOpacity>
  );
};
