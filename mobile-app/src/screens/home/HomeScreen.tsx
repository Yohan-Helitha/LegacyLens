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

const FeedCardActions = ({ initialLikes, initialComments, onCommentPress }: { initialLikes: number, initialComments: number, onCommentPress: () => void }) => {
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

  return (
    <View style={styles.cardActions}>
      <View style={styles.leftActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.8}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons name={liked ? "heart" : "heart-outline"} size={28} color={liked ? "#FF4B4B" : Colors.textMuted} />
          </Animated.View>
          <Text style={[styles.actionCount, liked && { color: "#FF4B4B", fontWeight: '600' }]}>{likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onCommentPress}>
          <MaterialIcons name="chat-bubble-outline" size={26} color={Colors.textMuted} />
          <Text style={styles.actionCount}>{commentsCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Animated.View style={{ transform: [{ scale: shareScale }] }}>
            <MaterialIcons name="share" size={26} color={Colors.textMuted} />
          </Animated.View>
          <Text style={styles.actionCount}>Share</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
        <Animated.View style={{ transform: [{ translateY: saveTranslateY }] }}>
          <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={28} color={saved ? "#fe893e" : Colors.textMuted} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const FollowButton = () => {
  const [following, setFollowing] = useState(false);
  return (
    <TouchableOpacity 
      style={[styles.followButton, following && styles.followingButton]} 
      onPress={() => setFollowing(!following)}
      activeOpacity={0.8}
    >
      <MaterialIcons name={following ? "check" : "add"} size={16} color={following ? "#fe893e" : '#ffffff'} />
      <Text style={[styles.followButtonText, following && styles.followingButtonText]}>
        {following ? 'Following' : 'Follow'}
      </Text>
    </TouchableOpacity>
  );
};

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

const loadedVideoIds = new Set<string>();

const VideoLoader = () => {
  const time = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(time, {
        toValue: 4000,
        duration: 4000,
        useNativeDriver: false,
        easing: Easing.linear,
      })
    ).start();
  }, [time]);

  const getTLBR = (anim: any) => anim.interpolate({
    inputRange: [0, 200, 600, 800, 1200, 1400, 1800, 2000, 2200, 2600, 2800, 3200, 3400, 3800, 4000],
    outputRange: [0, 0, 17.5, 17.5, 17.5, 17.5, 0, 0, 0, 17.5, 17.5, 17.5, 17.5, 0, 0]
  });
  const getTRBL = (anim: any) => anim.interpolate({
    inputRange: [0, 200, 600, 800, 1200, 1400, 1800, 2000, 2200, 2600, 2800, 3200, 3400, 3800, 4000],
    outputRange: [0, 0, 0, 0, 17.5, 17.5, 17.5, 17.5, 17.5, 17.5, 17.5, 0, 0, 0, 0]
  });

  const p1_time = time;
  const p2_time = Animated.modulo(Animated.add(time, 1000), 4000);

  const renderSquare = (p_time: any, key: string) => {
    const tlbr = getTLBR(p_time);
    const trbl = getTRBL(p_time);
    return (
      <Animated.View
        key={key}
        style={[
          styles.loaderSquare,
          {
            borderTopLeftRadius: tlbr,
            borderBottomRightRadius: tlbr,
            borderTopRightRadius: trbl,
            borderBottomLeftRadius: trbl,
          }
        ]}
      />
    );
  };

  return (
    <View style={styles.loaderContainer}>
      <View style={styles.loaderGrid}>
        {renderSquare(p1_time, 'tl')}
        {renderSquare(p2_time, 'tr')}
        {renderSquare(p2_time, 'bl')}
        {renderSquare(p1_time, 'br')}
      </View>
    </View>
  );
};

const VideoCard = ({ v, isPlaying, item, setActivePostId, setCommentModalVisible }: any) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(() => loadedVideoIds.has(v.id));
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
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.authorRow}>
          <View style={styles.authorInitialBubble}>
            <Text style={styles.authorInitialText}>{v.author[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.authorName, { flexShrink: 1 }]} adjustsFontSizeToFit={true} minimumFontScale={0.6} numberOfLines={1}>{v.author}</Text>
              <MaterialIcons name="verified" size={14} color="#fe893e" />
            </View>
            <Text style={styles.timeAgo}>Video</Text>
          </View>
        </View>

      </View>

      <View style={styles.videoHeroContainer}>
        {showLoader && !isReady && <VideoLoader />}
        <Video
          source={{ uri: v.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4" }}
          style={[styles.videoThumbnail, !isReady && { opacity: 0 }]}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isPlaying}
          isLooping
          isMuted={isMuted}
          useNativeControls={false}
          onReadyForDisplay={() => {
            setIsReady(true);
            loadedVideoIds.add(v.id);
          }}
          onLoadStart={() => {
            if (!loadedVideoIds.has(v.id)) {
              setIsReady(false);
            }
          }}
        />
        <View style={styles.videoBadgesRow}>
          <View style={styles.glassBadge}>
            <MaterialIcons name="schedule" size={13} color="#fff" />
            <Text style={styles.glassBadgeText}>{v.duration}</Text>
          </View>
          {v.location && (
            <View style={styles.glassBadge}>
              <MaterialIcons name="location-on" size={13} color="#fff" />
              <Text style={styles.glassBadgeText}>{v.location}</Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.muteButton}
          onPress={() => setIsMuted(!isMuted)}
          activeOpacity={0.8}
        >
          <MaterialIcons name={isMuted ? "volume-off" : "volume-up"} size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.videoBottomOverlay}>
        <Text style={[styles.videoTitle, { color: Colors.text }]} numberOfLines={2}>{v.title}</Text>
      </View>

      <FeedCardActions
        initialLikes={Math.floor(Math.random() * 500) + 20}
        initialComments={Math.floor(Math.random() * 100) + 5}
        onCommentPress={() => {
          setActivePostId(item.id);
          setCommentModalVisible(true);
        }}
      />
    </View>
  );
};

export type VItem = typeof mockData.videos[0]  & { type: 'video' };
export type BItem = typeof mockData.blogs[0]   & { type: 'blog' };
export type AItem = typeof mockData.audio[0]   & { type: 'audio' };

// ─────────────────────────────────────────────────────────────────────────────
// AudioCard — stateful play / pause / resume for Home feed audio posts
// ─────────────────────────────────────────────────────────────────────────────
const TOTAL_BARS = 30; // number of waveform bars rendered

const AudioCard = ({
  a,
  item,
  setActivePostId,
  setCommentModalVisible,
}: {
  a: AItem;
  item: any;
  setActivePostId: (id: string) => void;
  setCommentModalVisible: (v: boolean) => void;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 … TOTAL_BARS

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && progress < TOTAL_BARS) {
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= TOTAL_BARS) {
            setIsPlaying(false);
            return TOTAL_BARS;
          }
          return p + 1;
        });
      }, 600);
    }
    return () => clearInterval(interval);
  }, [isPlaying, progress]);

  const handlePlayPause = () => {
    if (progress >= TOTAL_BARS) {
      // Replay from start
      setProgress(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(prev => !prev);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.authorRow}>
          <Image source={{ uri: a.avatar }} style={styles.avatar} />
          <View>
            <Text style={styles.authorName}>{a.name}</Text>
            <Text style={styles.timeAgo}>{a.location}</Text>
          </View>
        </View>
        <View style={styles.audioBadge}>
          <MaterialIcons name="mic" size={13} color={Colors.secondary} />
          <Text style={styles.audioBadgeText}>Audio</Text>
        </View>
      </View>

      {a.topic ? <Text style={styles.audioTopic}>{a.topic}</Text> : null}

      {/* ── Audio strip inside green box — full width, flex bars ── */}
      <View style={styles.audioStrip}>
        {/* Play / Pause button */}
        <TouchableOpacity
          onPress={handlePlayPause}
          activeOpacity={0.8}
          style={styles.audioPlayBtn}
        >
          <MaterialIcons
            name={isPlaying ? 'pause' : 'play-arrow'}
            size={26}
            color={Colors.white}
          />
        </TouchableOpacity>

        {/* Waveform — always TOTAL_BARS, each bar flex:1 to fill width */}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', height: 40, gap: 2 }}>
          {Array.from({ length: TOTAL_BARS }, (_, i) => {
            const src = a.bars && a.bars.length > 0 ? a.bars : [2,3,4,5,3,2,4,5,3,2];
            const h = src[i % src.length] as number;
            return (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: Math.max(6, h * 5),
                  borderRadius: 2,
                  backgroundColor: i < progress ? '#fe893e' : 'rgba(255,255,255,0.4)',
                }}
              />
            );
          })}
        </View>

        {/* Duration */}
        <Text style={styles.audioDurationText}>{a.duration}</Text>
      </View>

      <FeedCardActions
        initialLikes={Math.floor(Math.random() * 500) + 20}
        initialComments={Math.floor(Math.random() * 100) + 5}
        onCommentPress={() => {
          setActivePostId(item.id);
          setCommentModalVisible(true);
        }}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Component Definition
// ─────────────────────────────────────────────────────────────────────────────
export const HomeScreen: React.FC = () => {
  // State variables
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Explore all');
  const [refreshing, setRefreshing] = useState(false);

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
      const q = searchQuery.toLowerCase();
      if (!lower.some(k => k.includes(q))) return false;
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
        
        <Header />

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
                  const isPlaying = visibleVideoId === v.id;
                  return (
                    <VideoCard 
                      v={v} 
                      isPlaying={isPlaying} 
                      item={item} 
                      setActivePostId={setActivePostId} 
                      setCommentModalVisible={setCommentModalVisible} 
                    />
                  );
                }

                /* ── BLOG / STORY CARD ───────────────────────────────── */
                if (item.type === 'blog') {
                  const b = item as BItem;
                  return (
                    <View style={styles.card}>
                      <View style={styles.cardHeader}>
                        <View style={styles.authorRow}>
                          <View style={styles.authorInitialBubble}>
                            <Text style={styles.authorInitialText}>{b.author[0]}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Text style={[styles.authorName, { flexShrink: 1 }]} adjustsFontSizeToFit={true} minimumFontScale={0.6} numberOfLines={1}>{b.author}</Text>
                              <MaterialIcons name="verified" size={14} color="#fe893e" />
                            </View>
                            <Text style={styles.timeAgo}>{b.readTime} read</Text>
                          </View>
                        </View>

                      </View>

                      <Image source={{ uri: b.thumbnail }} style={styles.blogHeroImage} resizeMode="cover" />

                      <View style={styles.blogBody}>
                        <View style={styles.editorialTag}>
                          <Text style={styles.editorialTagText}>STORY</Text>
                        </View>
                        <Text style={styles.blogTitle}>{b.title}</Text>
                        {b.excerpt ? <Text style={styles.blogExcerpt} numberOfLines={3}>{b.excerpt}</Text> : null}
                        <TouchableOpacity style={styles.readMoreBtn} activeOpacity={0.8}>
                          <Text style={styles.readMoreText}>Read Full Story</Text>
                          <MaterialIcons name="arrow-forward" size={16} color={Colors.secondary} />
                        </TouchableOpacity>
                      </View>

                      <FeedCardActions
                        initialLikes={Math.floor(Math.random() * 500) + 20}
                        initialComments={Math.floor(Math.random() * 100) + 5}
                        onCommentPress={() => {
                          setActivePostId(item.id);
                          setCommentModalVisible(true);
                        }}
                      />
                    </View>
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

