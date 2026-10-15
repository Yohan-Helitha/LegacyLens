import React, { useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography } from '../../../theme';
import { styles } from './BlogDetailScreen.styles';
import { AvatarPlaceholder } from '../../../components/common/AvatarPlaceholder';
import { getMediaUrl } from '../../../constants/api';

export interface BlogDetailScreenProps {
  post?: any;
  onBack?: () => void;
  onNavigateSearch?: (query: string) => void;
}

const DEFAULT_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBwEVG3n4_qVeLpvR0JQTwY1F_K-fZEglPFRI9_t9HPn_IMdB39xj6QA5jv16VZ0Ha7h0rYrfI70Iy5p5dyXD1nWvlU-3H-4D_wdeDG2btOJcdiITai86vvb9s0DZu6TiGSZy0jtkLFFMilyFmm4HznJ9K7ry5FhvUUNoun0LzVFzpfF0eTHz6nSMJIL7xvT85vUVaTPd9aOQNH6HdrEHxSsRkTBKQ-34yxrrYGgYKZ4fDT44A3Ous5';

const DEFAULT_TAGS = ['Southern Village Life', 'Traditional Household Objects', 'Colonial Era Trade'];

export const BlogDetailScreen: React.FC<BlogDetailScreenProps> = ({
  post,
  onBack,
  onNavigateSearch,
}) => {
  const [vocabOpen, setVocabOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [fontScale, setFontScale] = useState(1); // 1, 1.15, 1.3

  const handleShare = async () => {
    try {
      const shareTitle = post?.title || 'LegacyLens Cultural Story';
      await Share.share({
        message: `Check out "${shareTitle}" on LegacyLens! https://legacylens.app/story/${post?.id || 'matara'}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const toggleFontSize = () => {
    setFontScale(prev => (prev === 1 ? 1.15 : prev === 1.15 ? 1.3 : 1));
  };

  const rawThumb = post?.thumbnail || post?.imageUrl;
  const thumbnail = rawThumb && !rawThumb.startsWith('http')
    ? getMediaUrl(rawThumb.startsWith('/uploads/') ? rawThumb : (rawThumb.startsWith('uploads/') ? `/${rawThumb}` : `/uploads/${rawThumb.replace(/^\/+/, '')}`))
    : (rawThumb || null);
  const title = post?.title || 'The Last Hands That Still Remember';
  const location = post?.location || 'Matara, Sri Lanka';
  const category = post?.category || (post?.tags && post.tags[0]) || 'Craft Tradition';
  const author = post?.author || 'Nadeesha Perera';
  const avatar = post?.avatar || DEFAULT_AVATAR;
  const readTime = post?.readTime || '8 min read';
  const tags: string[] = post?.tags && post.tags.length > 0 ? post.tags : DEFAULT_TAGS;

  const contentText =
    post?.content ||
    post?.description ||
    post?.excerpt ||
    "The scent of dried rush grass hangs heavy in the humid afternoon air of Matara. Here, in the shaded veranda of a colonial-era home, Somawathi's hands move with a rhythm born of seventy years of repetition. They are hands that map a fading history, tracing patterns in reed that were once the lifeblood of southern coastal villages.";

  const firstChar = contentText.charAt(0) || 'T';
  const restOfFirstSentence = contentText.slice(1);

  return (
    <View style={styles.flex1}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* Top App Bar Overlay */}
      <SafeAreaView style={styles.headerOverlay} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* Editorial Hero */}
        <View style={styles.heroSection}>
          {thumbnail ? (
            <ImageBackground source={{ uri: thumbnail }} style={styles.heroImg}>
              <View style={styles.heroGradient}>
                <View style={styles.heroContent}>
                  <View style={styles.heroTags}>
                    <View style={styles.heroTagBorder}>
                      <Text style={styles.heroTagText}>{location}</Text>
                    </View>
                    <View style={styles.heroTagSolid}>
                      <Text style={styles.heroTagTextSolid}>{category}</Text>
                    </View>
                  </View>
                  <Text style={styles.heroTitle}>{title}</Text>

                  <View style={styles.authorRow}>
                    <View style={styles.authorGroup}>
                      <AvatarPlaceholder
                        name={author}
                        avatarUrl={post?.avatar}
                        size={32}
                        theme="dark"
                      />
                      <Text style={styles.authorName}>{author}</Text>
                    </View>
                    <View style={styles.dotSeparator} />
                    <View style={styles.timeGroup}>
                      <MaterialIcons name="schedule" size={14} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.timeText}>{readTime}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </ImageBackground>
          ) : (
            <View style={[styles.heroImg, { backgroundColor: '#182b2b' }]}>
              <View style={[styles.heroGradient, { backgroundColor: 'transparent' }]}>
                <View style={styles.heroContent}>
                  <View style={styles.heroTags}>
                    <View style={styles.heroTagBorder}>
                      <Text style={styles.heroTagText}>{location}</Text>
                    </View>
                    <View style={styles.heroTagSolid}>
                      <Text style={styles.heroTagTextSolid}>{category}</Text>
                    </View>
                  </View>
                  <Text style={styles.heroTitle}>{title}</Text>

                  <View style={styles.authorRow}>
                    <View style={styles.authorGroup}>
                      <AvatarPlaceholder
                        name={author}
                        avatarUrl={post?.avatar}
                        size={32}
                        theme="dark"
                      />
                      <Text style={styles.authorName}>{author}</Text>
                    </View>
                    <View style={styles.dotSeparator} />
                    <View style={styles.timeGroup}>
                      <MaterialIcons name="schedule" size={14} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.timeText}>{readTime}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Content Area */}
        <View style={styles.bodyContent}>
          <View style={[styles.paragraph, { marginBottom: 4 }]}>
            <Text style={styles.dropCap}>{firstChar}</Text>
            <Text
              style={[
                styles.bodyText,
                { fontSize: 19 * fontScale, lineHeight: 32 * fontScale },
              ]}
            >
              {restOfFirstSentence}
            </Text>
          </View>

          

          {/* Cultural Context Aside */}
          <View style={styles.asideBox}>
            <View style={styles.asideDeco} />
            <View style={styles.asideHeaderRow}>
              <View style={styles.asideIconBox}>
                <MaterialIcons name="info" size={20} color={Colors.white} />
              </View>
              <Text style={[styles.asideTitle, { fontSize: 16 * fontScale }]}>
                {category} & Living Roots
              </Text>
            </View>
            <Text
              style={[
                styles.asideText,
                { fontSize: 14 * fontScale, lineHeight: 24 * fontScale },
              ]}
            >
              Historically native to Sri Lanka's cultural heartlands. These patterns and knowledge frameworks indicated identity, regional origin, and spiritual kinship. Today, master practitioners are vital custodians of this endangered memory.
            </Text>
          </View>
            
          
          {/* Preservation Section */}
          <View style={styles.preservationBox}>
            <View style={styles.preservationHeader}>
              <Text style={[styles.preservationTitle, { fontSize: 24 * fontScale }]}>
                What This Story Preserves
              </Text>
            </View>
            <View style={styles.preservationList}>
              <View style={styles.preservationItem}>
                <MaterialIcons name="record-voice-over" size={24} color={Colors.accent} />
                <View style={styles.preservationInfo}>
                  <Text style={[styles.preservationItemTitle, { fontSize: 14 * fontScale }]}>
                    Oral Knowledge
                  </Text>
                  <Text style={[styles.preservationItemDesc, { fontSize: 14 * fontScale }]}>
                    Chants, formulas, and oral techniques recorded from living Knowledge Keepers.
                  </Text>
                </View>
              </View>
              <View style={styles.preservationItem}>
                <MaterialIcons name="groups" size={24} color={Colors.accent} />
                <View style={styles.preservationInfo}>
                  <Text style={[styles.preservationItemTitle, { fontSize: 14 * fontScale }]}>
                    Community Memory
                  </Text>
                  <Text style={[styles.preservationItemDesc, { fontSize: 14 * fontScale }]}>
                    Social structures, traditional crafts, and regional rituals across Sri Lanka.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Explore Connections */}
          <View style={styles.exploreSection}>
            <Text style={[styles.exploreTitle, { fontSize: 14 * fontScale }]}>
              EXPLORE CONNECTIONS
            </Text>
            <View style={styles.exploreTags}>
              {tags.map((tag: string, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.exploreTag}
                  onPress={() => onNavigateSearch?.(tag)}
                >
                  <MaterialIcons
                    name={idx === 0 ? 'holiday-village' : idx === 1 ? 'kitchen' : 'history'}
                    size={16 * fontScale}
                    color={Colors.secondary}
                  />
                  <Text style={[styles.exploreTagText, { fontSize: 12 * fontScale }]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Guaranteed Bottom Spacer for Action Bar */}
          <View style={{ height: 550 }} />
        </View>
      </ScrollView>

      {/* Floating Reading Toolbar */}
      <View style={styles.toolbarContainer}>
        <View style={styles.toolbarInner}>
          <TouchableOpacity
            style={styles.toolbarBtn}
            onPress={() => setIsSaved(!isSaved)}
          >
            <MaterialIcons
              name={isSaved ? 'bookmark' : 'bookmark-add'}
              size={24}
              color={isSaved ? '#fe893e' : Colors.textMuted}
            />
          </TouchableOpacity>
          <View style={styles.toolbarDivider} />
          <TouchableOpacity
            onPress={toggleFontSize}
            style={{ paddingHorizontal: 8, paddingVertical: 4 }}
          >
            <Text
              style={[
                styles.toolbarProgressText,
                fontScale > 1 && { color: '#fe893e' },
              ]}
            >
              {Math.round(fontScale * 100)}%
            </Text>
          </TouchableOpacity>
          <View style={styles.toolbarDivider} />
          <TouchableOpacity
            style={styles.toolbarBtnAccent}
            onPress={handleShare}
          >
            <MaterialIcons name="share" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
