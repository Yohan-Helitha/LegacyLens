import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from './BlogCard.styles';
import { FeedCardActions } from './FeedCardActions';

export const BlogCard = ({ b, item, setActivePostId, setCommentModalVisible, onNavigate }: any) => {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onNavigate?.('blog')} style={styles.premiumCard}>
      <View style={styles.premiumHeroBox}>
        <Image source={{ uri: b.thumbnail }} style={styles.premiumHeroImg} resizeMode="cover" />
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
            <Image source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200' }} style={styles.premiumAvatar} />
            <View>
              <Text style={styles.premiumAuthorName}>{b.author}</Text>
              <Text style={styles.premiumAuthorSub}>{'Blog · ' + (b.readTime || '')}</Text>
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
