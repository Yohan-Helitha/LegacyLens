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
import { styles } from './SearchScreen.styles';

import { FeedCardActions } from '../../components/home/FeedCardActions';
import { VideoCard } from '../../components/home/VideoCard';
import { BlogCard } from '../../components/home/BlogCard';
import { AudioCard } from '../../components/home/AudioCard';
import { loadedVideoIds, VItem, BItem, AItem } from '../home/HomeScreen';

const CATEGORIES = mockData.categories as Array<{
  id: string; label: string; icon: string; color: string; tags: string[];
}>;

// ─────────────────────────────────────────────────────────────────────────────
// Component Definition
// ─────────────────────────────────────────────────────────────────────────────
export const SearchScreen: React.FC<{ 
  onNavigate?: (tab: string) => void, 
  isOverlayActive?: boolean,
  initialSearchQuery?: string,
  onBack?: () => void
}> = ({ onNavigate, isOverlayActive, initialSearchQuery, onBack }) => {
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
  const [headerHeight, setHeaderHeight] = useState(100);

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

  const headerTranslateY = 0;



  return (
    <View style={[styles.safeArea, { backgroundColor: Colors.secondary }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.secondary} />

      <CommentModal 
        visible={commentModalVisible} 
        onClose={() => setCommentModalVisible(false)} 
        postId={activePostId} 
      />

      <View style={{ flex: 1, overflow: 'hidden', backgroundColor: '#F8FAF9' }}>
        <Animated.View 
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
          style={[styles.stickyHeader, { backgroundColor: Colors.secondary, transform: [{ translateY: headerTranslateY }] }]}
        >
        
        {/* Custom Dark Green Search Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          paddingHorizontal: Spacing.md,
          paddingTop: (StatusBar.currentHeight || 24) + Spacing.sm,
          paddingBottom: Spacing.md,
          backgroundColor: Colors.secondary,
        }}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={{ marginRight: Spacing.sm, padding: 4, marginLeft: -4, marginTop: 4 }}>
              <MaterialIcons name="arrow-back" size={26} color={Colors.white} />
            </TouchableOpacity>
          )}
          
          <View style={styles.tagInputContainer}>
            <MaterialIcons
              name="search"
              size={24}
              color={Colors.textMuted}
              style={{ marginTop: 3 }}
            />
            
            <View style={styles.tagInputInner}>
              {(searchQuery.match(/#[^\s]+/g) || []).map(tag => (
                <View key={tag} style={styles.tagPill}>
                  <Text style={styles.tagPillText}>{tag}</Text>
                  <TouchableOpacity onPress={() => setSearchQuery(searchQuery.replace(tag, '').replace(/\s+/g, ' ').trim())}>
                    <MaterialIcons name="close" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}

              <TextInput
                style={styles.tagTextInput}
                placeholder={searchQuery.match(/#[^\s]+/g) ? "Add tag..." : "Search by tags..."}
                placeholderTextColor="#6F7978"
                value={searchQuery.replace(/#[^\s]+/g, '').trimStart()}
                onChangeText={(text) => {
                  const tags = (searchQuery.match(/#[^\s]+/g) || []).join(' ');
                  setSearchQuery((tags ? tags + ' ' : '') + text);
                }}
                autoCapitalize="none"
              />
            </View>
            
          </View>
        </View>
      </Animated.View>

      <Animated.FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + 16 }]}
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
        ListHeaderComponent={null}
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
                      loadedVideoIds={loadedVideoIds}
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


export default SearchScreen;

