import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from './BlogCard.styles';
import { FeedCardActions } from './FeedCardActions';
import { homeApi } from '../../services/api/homeApi';
import { getMediaUrl } from '../../constants/api';
import { AvatarPlaceholder } from '../common/AvatarPlaceholder';

export const BlogCard = ({ b, item, setActivePostId, setCommentModalVisible, onNavigate, onLikeChange, initialLiked }: any) => {
  const rawThumb = b.thumbnail || item?.thumbnail || item?.imageUrl;
  const resolvedThumbnail = rawThumb && !rawThumb.startsWith('http')
    ? getMediaUrl(rawThumb.startsWith('/uploads/') ? rawThumb : (rawThumb.startsWith('uploads/') ? `/${rawThumb}` : `/uploads/${rawThumb.replace(/^\/+/, '')}`))
    : (rawThumb || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600');

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onNavigate?.('blog', item || b)} style={styles.premiumCard}>
      <View style={styles.premiumHeroBox}>
        <Image source={{ uri: resolvedThumbnail }} style={styles.premiumHeroImg} resizeMode="cover" />
        <View style={styles.premiumBadge}>
          <MaterialIcons name="menu-book" size={14} color="#fff" />
          <Text style={styles.premiumBadgeText}>READ STORY</Text>
        </View>
      </View>

      <View style={styles.premiumContent}>
        <Text style={styles.premiumTitle} numberOfLines={2}>{b.title}</Text>
        {b.excerpt ? <Text style={styles.premiumDesc} numberOfLines={2}>{b.excerpt}</Text> : null}
        <View style={styles.premiumDivider} />

        <View style={styles.premiumFooter}>
          <View style={styles.premiumAuthorBox}>
            <AvatarPlaceholder
              name={b.author}
              avatarUrl={b.avatar || item?.avatar}
              size={36}
              theme="dark"
            />
            <View>
              <Text style={styles.premiumAuthorName}>{b.author}</Text>
              <Text style={styles.premiumAuthorSub}>{'Blog · ' + (b.readTime || '')}</Text>
            </View>
          </View>
        </View>

        <FeedCardActions
          postId={item?.id || b?.id}
          theme="dark"
          initialLikes={b.likesCount ?? item?.likesCount ?? 0}
          initialComments={b.commentsCount ?? item?.commentsCount ?? 0}
          initialLiked={initialLiked ?? item?.liked ?? b?.liked ?? false}
          onLikeChange={onLikeChange}
          onCommentPress={() => {
            setActivePostId(item?.id || b?.id);
            setCommentModalVisible(true);
          }}
        />
      </View>
    </TouchableOpacity>
  );
};
