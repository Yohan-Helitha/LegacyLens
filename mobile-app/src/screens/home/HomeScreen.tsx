import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Easing } from 'react-native';
import {
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StatusBar,
  RefreshControl,
  Animated,
  Alert,
  Share,
StyleSheet,} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode, Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { VoiceSearchModal } from '../../components/common/VoiceSearchModal';
import { CommentModal } from '../../components/common/CommentModal';
import { Header } from '../../components/common/Header';
import { KnowledgeKeeper } from '../../components/home/KnowledgeKeeper';
import { WordOfTheDay } from '../../components/home/WordOfTheDay';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import mockData from '../admin/mockData.json';
import { styles } from './HomeScreen.styles';

import { FeedCardActions } from '../../components/home/FeedCardActions';
import { VideoCard } from '../../components/home/VideoCard';
import { BlogCard } from '../../components/home/BlogCard';
import { AudioCard } from '../../components/home/AudioCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.md * 2;

// ─────────────────────────────────────────────────────────────────────────────
// Types & Mock Data
// ─────────────────────────────────────────────────────────────────────────────
// Categories loaded from mockData — first 10, scrollable in groups of ~6
const CATEGORIES = mockData.categories as Array<{
  id: string; label: string; icon: string; color: string; tags: string[];
}>;

const MEDIA_TABS = ['Explore all', 'Videos', 'Blogs', 'Audio'];

interface CarouselItem {
  id: string;
  title: string;
  imageUrl: string;
}

const CAROUSEL_SLIDES: CarouselItem[] = [
  {
    id: '1',
    title: '1/5: The Kuruniya',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDr7UzRYBUO3XqhCQBBb5WHBPLuLcHe8t9D4hzyfmyoXnXuYSwpOtQC9Y7RDCp10F-Zk5hWNlyeN_VlQIcaLejJG9UPQbrdLxwE4UgEw2M0qXmZ2WPa-e_mfgIxuAyyUiPPp-ykdqhD2N7KUtxIz5Vvl-phI92CPrTTHAKdhwLYjWL4sactq0CcjU0YqbKf-DqRzD04zUFbDSc9BQzQxvLnYq7CjBuctG-2E7VoGuq_gKbzc5qiwOEL',
  },
  {
    id: '2',
    title: '2/5: The Miris Gala',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDIKeFplu_8V74siKko3f5h_D0X2Y0xnVq6jnd-yWLz-y5sfsZVl4rGy8Ze28cxpDszMIH3rQ5ZvMqFxaCcrCTIpWevyw4hpaNHai8NNlieaZ5c9MPcKu-vppTFUnPAKmAuzf4idjqaTz8bXypu2bhqNQxYmUPzJLesAok48R5KEKMf_qCMM95nUmFhOP-awvI3X7-ReDQfs9DbywiUU7NutnaiCtL8iZSXoCrUvi_9fxRmPT1sT0e4',
  },
  {
    id: '3',
    title: '3/5: The Kulla',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAUFQOi6JTQxYufZD5r4T7feOJWcR-TowUyE5hz5brgj36kChsmmdmheJIiaV0Mslesw6MwYzJy41JFS0Sth1BRDeicDZ9woltwMnSQiuAhvrJSOVCkVpIE0ZZzvxWbE0CLlrcGcEVbALBlN0MDhLCPKoIspc1yNUmTkjy1gl7aimiTsXfb1S6r2W3HT62L3vCLIUEhIXu2FAXmTx7MW0dAzMPA2Sbfu8T710zathuocbHmf2AlsLmI',
  },
];

interface SpotlightItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
}

const SPOTLIGHT_ITEMS: SpotlightItem[] = [
  {
    id: '1',
    title: 'Nallur Festival',
    category: 'Tradition',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAUFQOi6JTQxYufZD5r4T7feOJWcR-TowUyE5hz5brgj36kChsmmdmheJIiaV0Mslesw6MwYzJy41JFS0Sth1BRDeicDZ9woltwMnSQiuAhvrJSOVCkVpIE0ZZzvxWbE0CLlrcGcEVbALBlN0MDhLCPKoIspc1yNUmTkjy1gl7aimiTsXfb1S6r2W3HT62L3vCLIUEhIXu2FAXmTx7MW0dAzMPA2Sbfu8T710zathuocbHmf2AlsLmI',
  },
  {
    id: '2',
    title: 'Palmyra Crafts',
    category: 'Artisans',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDIKeFplu_8V74siKko3f5h_D0X2Y0xnVq6jnd-yWLz-y5sfsZVl4rGy8Ze28cxpDszMIH3rQ5ZvMqFxaCcrCTIpWevyw4hpaNHai8NNlieaZ5c9MPcKu-vppTFUnPAKmAuzf4idjqaTz8bXypu2bhqNQxYmUPzJLesAok48R5KEKMf_qCMM95nUmFhOP-awvI3X7-ReDQfs9DbywiUU7NutnaiCtL8iZSXoCrUvi_9fxRmPT1sT0e4',
  },
  {
    id: '3',
    title: 'Odiyal Kool',
    category: 'Cuisine',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCSAF6va7clah5r0l7SWtHkDuIlDVFP0khY70SKJ8gXxGzKwGpaIZ-a_jHd4dBUZZSBT1Z7R5fYxxjKx6cMPSGJTXFM-EXi8S2BKuPUeNsFbkx10roi1bi4JNWbPTUmZeI_HiYexDnEc64xzeuxx0DwZG5Ed5lrWxFv42U5LlCpGbY3YLxbBItmlBqB9tKuP8JIE66btR-ji9ubQHi1dCtsmK73tGj-T17zl5i3kksHX_a9ISdLHmMX',
  },
];

export const loadedVideoIds = new Set<string>();

export type VItem = typeof mockData.videos[0]  & { type: 'video' };
export type BItem = typeof mockData.blogs[0]   & { type: 'blog' };
export type AItem = typeof mockData.audio[0]   & { type: 'audio' };

// ─────────────────────────────────────────────────────────────────────────────
// Component Definition
// ─────────────────────────────────────────────────────────────────────────────
export const HomeScreen: React.FC<{ 
  onNavigate?: (tab: string) => void, 
  isOverlayActive?: boolean,
  initialSearchQuery?: string 
}> = ({ onNavigate, isOverlayActive, initialSearchQuery }) => {
  // State variables
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Explore all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Voice Search
  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);

  // Comment Modal
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [activePostId, setActivePostId] = useState('');

  // Missing states & callbacks
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPulse = useRef(new Animated.Value(1)).current;
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [visibleVideoId, setVisibleVideoId] = useState<string | null>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    const videoItem = viewableItems.find(
      (v) => v.item.type === 'video' && v.isViewable
    );
    if (videoItem) {
      setVisibleVideoId(videoItem.item.id);
    } else {
      setVisibleVideoId(null);
    }
  }).current;

  const handleVoiceResult = (text: string) => {
    setSearchQuery(text);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1200);
  };

  const handleAudioPress = () => {
    setIsPlayingAudio(true);
    Animated.sequence([
      Animated.timing(audioPulse, { toValue: 1.2, duration: 150, useNativeDriver: true }),
      Animated.timing(audioPulse, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(audioPulse, { toValue: 1.2, duration: 150, useNativeDriver: true }),
      Animated.timing(audioPulse, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start(() => setIsPlayingAudio(false));
  };

  const handleCarouselScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / slideSize);
    setCarouselIndex(index);
  };

  // ── Shuffled Initial Feed ────────────────────────────────────────────────
  // Combine all items, add type tag, and shuffle once on mount
  const allFeedItems = useMemo(() => {
    type VItem = typeof mockData.videos[0]  & { type: 'video' };
    type BItem = typeof mockData.blogs[0]   & { type: 'blog' };
    type AItem = typeof mockData.audio[0]   & { type: 'audio' };
    
    const videos = mockData.videos.map(v => ({ ...v, type: 'video' as const }));
    const blogs  = mockData.blogs.map(b  => ({ ...b, type: 'blog' as const }));
    const audios = mockData.audio.map(a  => ({ ...a, type: 'audio' as const }));
    
    const combined = [...videos, ...blogs, ...audios];
    
    // Fisher-Yates shuffle
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }
    
    return combined;
  }, []);

  // 🎙️ Filtering logic 🎙️🎙️🎙️🎙️🎙️🎙️🎙️🎙️🎙️🎙️🎙️🎙️🎙️🎙️🎙️🎙️🎙️
  const filterMatches = (keywords: string[]) => {
    if (!searchQuery && !selectedCategoryId) return true;
    
    const lower = keywords.map(k => k.toLowerCase());
    
    // 1. Search bar filter
    if (searchQuery) {
      const queryParts = searchQuery.toLowerCase().split(' ').map(p => p.replace(/^#/, '')).filter(p => p.trim() !== '');
      const matchesAnyPart = queryParts.some(part => lower.some(k => k.includes(part) || part.includes(k)));
      if (!matchesAnyPart) return false;
    }

    // 2. Category pill filter
    if (selectedCategoryId) {
      const cat = CATEGORIES.find(c => c.id === selectedCategoryId);
      if (cat) {
        const catTags = cat.tags.map(t => t.toLowerCase());
        if (!lower.some(k => catTags.some(t => k.includes(t)))) return false;
      }
    }

    return true;
  };

  // Derive final feed based on tab, then search/category filters
  const feed = useMemo(() => {
    let pool = allFeedItems;
    if (activeTab === 'Videos') {
      pool = allFeedItems.filter(i => i.type === 'video');
    } else if (activeTab === 'Blogs') {
      pool = allFeedItems.filter(i => i.type === 'blog');
    } else if (activeTab === 'Audio') {
      pool = allFeedItems.filter(i => i.type === 'audio');
    }

    return pool.filter(item => {
      const kw = [
        (item as any).title  || (item as any).name  || '',
        (item as any).author || (item as any).name  || '',
        (item as any).location || '',
        (item as any).topic    || '',
        (item as any).excerpt  || '',
        ...((item as any).tags || []),
      ];
      return filterMatches(kw);
    });
  }, [allFeedItems, activeTab, searchQuery, selectedCategoryId]);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Hide top gap + search bar on scroll down (80px), keeping pills & filters sticky at top
  const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 24;
  const HIDE_HEADER_SEARCH_OFFSET = 165;
  const SCROLL_THRESHOLD = 165;
  const clampedScroll = Animated.diffClamp(scrollY, 0, SCROLL_THRESHOLD);

  const headerTranslateY = clampedScroll.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [0, -HIDE_HEADER_SEARCH_OFFSET],
    extrapolate: 'clamp',
  });

  const headerOrangeOpacity = clampedScroll.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const tabTextColor = headerOrangeOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.textMuted, 'rgba(255, 255, 255, 0.85)'],
  });

  const activeTabTextColor = headerOrangeOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.secondary, '#FFFFFF'],
  });

  const activeTabBorderColor = headerOrangeOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.secondary, '#FFFFFF'],
  });

  const pillsTopPadding = clampedScroll.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [4, (StatusBar.currentHeight || 24) + 6],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f5c5c" />

      <CommentModal 
        visible={commentModalVisible} 
        onClose={() => setCommentModalVisible(false)} 
        postId={activePostId} 
      />

      <View style={{ flex: 1, overflow: 'hidden' }}>
        <Animated.View style={[styles.stickyHeader, { transform: [{ translateY: headerTranslateY }] }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.accent, opacity: headerOrangeOpacity }]} />
        
        <Header onNavigate={onNavigate} />

        <View style={styles.searchBarSection}>
          <View style={styles.searchContainer}>
            <MaterialIcons
              name="search"
              size={26}
              color={Colors.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search stories, words, places, traditions..."
              placeholderTextColor="#6F7978"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              style={styles.micButton}
              activeOpacity={0.8}
              accessibilityLabel="Voice search"
              onPress={() => setIsVoiceModalVisible(true)}
            >
              <MaterialIcons name="mic" size={26} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 2: Category Pills + Explore Filter Tabs (Stays fixed at top on scroll down) */}
        <Animated.View style={[styles.pillsAndFilterSection, { paddingTop: pillsTopPadding }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickFiltersContainer}
            >
              <TouchableOpacity
                style={[
                  styles.quickFilterChip,
                  selectedCategoryId === null && { backgroundColor: '#0f5c5c', borderColor: '#0f5c5c' },
                ]}
                onPress={() => setSelectedCategoryId(null)}
                activeOpacity={0.75}
              >
                <MaterialIcons
                  name="apps"
                  size={15}
                  color={selectedCategoryId === null ? '#fff' : Colors.textMuted}
                />
                <Text style={[
                  styles.quickFilterText,
                  selectedCategoryId === null && styles.quickFilterTextActive,
                ]}>
                  All
                </Text>
              </TouchableOpacity>

              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.quickFilterChip,
                      isSelected && { backgroundColor: cat.color, borderColor: cat.color },
                    ]}
                    onPress={() => setSelectedCategoryId(isSelected ? null : cat.id)}
                    activeOpacity={0.75}
                  >
                    <MaterialIcons
                      name={cat.icon as any}
                      size={15}
                      color={isSelected ? '#fff' : cat.color}
                    />
                    <Text
                      style={[
                        styles.quickFilterText,
                        isSelected && styles.quickFilterTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.filterBar}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flex: 1 }}
                contentContainerStyle={styles.tabsContainer}
              >
                {MEDIA_TABS.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <TouchableOpacity
                      key={tab}
                      onPress={() => setActiveTab(tab)}
                      activeOpacity={0.75}
                    >
                      <Animated.View
                        style={[
                          styles.tabButton,
                          isActive && styles.tabButtonActive,
                          { borderBottomColor: isActive ? activeTabBorderColor : 'transparent' }
                        ]}
                      >
                        <Animated.Text
                          style={[
                            styles.tabText,
                            isActive && styles.tabTextActive,
                            { color: isActive ? activeTabTextColor : tabTextColor }
                          ]}
                        >
                          {tab}
                        </Animated.Text>
                      </Animated.View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </Animated.View>
      </Animated.View>

      <Animated.FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 275 }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.secondary, Colors.accent]}
            tintColor={Colors.secondary}
            progressViewOffset={190}
          />
        }
        ListHeaderComponent={
          <>
            {activeTab === 'Explore all' && !searchQuery && !selectedCategoryId && (
              <>
                <WordOfTheDay />
                <KnowledgeKeeper />
              </>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyStateText}>No results found</Text>
            <Text style={styles.emptyStateSubtext}>Try a different keyword or category</Text>
          </View>
        }
        renderItem={({ item }: any) => {
                /* ── VIDEO CARD ──────────────────────────────────────── */
                if (item.type === 'video') {
                  const v = item as VItem;
                  const isPlaying = visibleVideoId === v.id && !isOverlayActive;
                  return (
                    <VideoCard 
                      v={v} 
                      isPlaying={isPlaying} 
                      item={item} 
                      setActivePostId={setActivePostId} 
                      setCommentModalVisible={setCommentModalVisible} 
                      onNavigate={onNavigate}
                    />
                  );
                }

                /* ── BLOG / STORY CARD ───────────────────────────────── */
                if (item.type === 'blog') {
                  const b = item as BItem;
                  return (
                    <BlogCard 
                      b={b} 
                      item={item} 
                      setActivePostId={setActivePostId} 
                      setCommentModalVisible={setCommentModalVisible} 
                      onNavigate={onNavigate} 
                    />
                  );
                }

                /* ── AUDIO CARD ──────────────────────────────────────── */
                const a = item as AItem;
                return (
                  <AudioCard
                    a={a}
                    item={item}
                    setActivePostId={setActivePostId}
                    setCommentModalVisible={setCommentModalVisible}
                  />
                );
        }}
        ListFooterComponent={<View style={styles.bottomSpacer} />}
      />

      {/* ── Voice Search ─────────────────────────────────────────────────── */}
      </View>
      <VoiceSearchModal
        visible={isVoiceModalVisible}
        onClose={() => setIsVoiceModalVisible(false)}
        onResult={handleVoiceResult}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────


export default HomeScreen;

