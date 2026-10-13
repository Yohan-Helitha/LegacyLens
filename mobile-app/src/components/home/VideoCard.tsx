import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { styles } from './VideoCard.styles';
import { FeedCardActions } from './FeedCardActions';
import { VideoLoader } from './VideoLoader';
import { getMediaUrl } from '../../constants/api';
import { AvatarPlaceholder } from '../common/AvatarPlaceholder';

export const VideoCard = ({
  v,
  isPlaying,
  item,
  setActivePostId,
  setCommentModalVisible,
  onNavigate,
  loadedVideoIds,
  onLikeChange,
  initialLiked,
}: any) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(() => loadedVideoIds?.has?.(v?.id) ?? false);
  const [showLoader, setShowLoader] = useState(false);

  const rawUrl = v?.videoUrl || item?.videoUrl || item?.mediaUrl;
  const resolvedVideoUri = rawUrl && !rawUrl.startsWith('http')
    ? getMediaUrl(rawUrl.startsWith('/uploads/') ? rawUrl : (rawUrl.startsWith('uploads/') ? `/${rawUrl}` : `/uploads/${rawUrl.replace(/^\/+/, '')}`))
    : (rawUrl || '');
  const hasVideo = Boolean(resolvedVideoUri && resolvedVideoUri.trim().length > 0);

  const rawThumb = v?.thumbnail || item?.thumbnail || item?.imageUrl;
  const resolvedThumbnail = rawThumb && !rawThumb.startsWith('http')
    ? getMediaUrl(rawThumb.startsWith('/uploads/') ? rawThumb : (rawThumb.startsWith('uploads/') ? `/${rawThumb}` : `/uploads/${rawThumb.replace(/^\/+/, '')}`))
    : (rawThumb || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=600');

  const source = hasVideo ? { uri: resolvedVideoUri } : null;
  const player = useVideoPlayer(source, (p: any) => {
    p.loop = true;
    p.muted = isMuted;
  });

  useEffect(() => {
    if (!player || !hasVideo) return;
    if (isPlaying) {
      player.play();
    } else {
      player.pause();
    }
  }, [isPlaying, player, hasVideo]);

  useEffect(() => {
    if (!player) return;
    player.muted = isMuted;
  }, [isMuted, player]);

  useEffect(() => {
    if (!hasVideo) {
      setIsReady(true);
      setShowLoader(false);
      return;
    }
    let timer: NodeJS.Timeout;
    if (!isReady) {
      timer = setTimeout(() => setShowLoader(true), 300);
      const readyTimer = setTimeout(() => {
        setIsReady(true);
        loadedVideoIds?.add?.(v?.id);
      }, 900);
      return () => { clearTimeout(timer); clearTimeout(readyTimer); };
    } else {
      setShowLoader(false);
    }
    return () => clearTimeout(timer);
  }, [isReady, hasVideo, v?.id]);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onNavigate?.('video', item || v)} style={styles.premiumCard}>
      <View style={styles.premiumHeroBox}>
        {/* Cultural thumbnail image rendered underneath */}
        <Image source={{ uri: resolvedThumbnail }} style={styles.premiumHeroImg} resizeMode="cover" />

        {/* Real video player only active if video exists in DB */}
        {hasVideo && (
          <VideoView
            player={player}
            style={[styles.premiumHeroImg, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, !isReady && { opacity: 0 }]}
            contentFit="cover"
            nativeControls={false}
          />
        )}

        {(showLoader && !isReady) ? <VideoLoader /> : null}

        <View style={styles.premiumBadge}>
          <MaterialIcons name="play-circle-outline" size={14} color="#fff" />
          <Text style={styles.premiumBadgeText}>{hasVideo ? 'WATCH VIDEO' : 'VIDEO STORY'}</Text>
        </View>

        {hasVideo && (
          <TouchableOpacity
            style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 16 }}
            onPress={() => setIsMuted(!isMuted)}
          >
            <MaterialIcons name={isMuted ? 'volume-off' : 'volume-up'} size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.premiumContent}>
        <Text style={styles.premiumTitle} numberOfLines={2}>{v?.title || item?.title}</Text>
        <Text style={styles.premiumDesc} numberOfLines={2}>
          {v?.description || item?.description || 'Explore the deep traditions and cultural significance of Sri Lankan heritage.'}
        </Text>
        <View style={styles.premiumDivider} />
        <View style={styles.premiumFooter}>
          <View style={styles.premiumAuthorBox}>
            <AvatarPlaceholder
              name={v?.author || item?.author}
              avatarUrl={v?.avatar || item?.avatar}
              size={36}
              theme="dark"
            />
            <View>
              <Text style={styles.premiumAuthorName}>{v?.author || item?.author}</Text>
              <Text style={styles.premiumAuthorSub}>{'Video · ' + (v?.duration || item?.duration || '')}</Text>
            </View>
          </View>
        </View>

        <FeedCardActions
          postId={item?.id || v?.id}
          theme="dark"
          initialLikes={v?.likesCount ?? item?.likesCount ?? 0}
          initialComments={v?.commentsCount ?? item?.commentsCount ?? 0}
          initialLiked={initialLiked ?? item?.liked ?? v?.liked ?? false}
          onLikeChange={onLikeChange}
          onCommentPress={() => {
            setActivePostId(item?.id || v?.id);
            setCommentModalVisible(true);
          }}
        />
      </View>
    </TouchableOpacity>
  );
};
