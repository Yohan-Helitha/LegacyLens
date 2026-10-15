import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Image,
  Share,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography } from '../../../theme';
import { useVideoPlayer, VideoView } from 'expo-video';
import { CommentModal } from '../../../components/common/CommentModal';
import { homeApi, FeedItemResponse } from '../../../services/api/homeApi';
import { discoveryApi } from '../../../services/api/discoveryApi';
import { styles } from './VideoDetailScreen.styles';
import { AvatarPlaceholder } from '../../../components/common/AvatarPlaceholder';
import { getMediaUrl } from '../../../constants/api';
import { useRecordStoryView } from '../../../hooks/useRecordStoryView';
import { useTranslatedTexts } from '../../../hooks/useTranslatedTexts';
import { TranslationToggle } from '../../../components/common/TranslationToggle';

export interface VideoDetailScreenProps {
  post?: any;
  onBack?: () => void;
  onNavigateMap?: (location: string) => void;
  onNavigateSearch?: (query: string) => void;
  onSelectRelatedPost?: (post: any) => void;
}

const DEFAULT_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAJddldj0j2P6Ei0-tjnizjoCg7UTQFEOj4JzzD3cvcqYCb7ul1d5DrS0zO1zyjB5y9jdTionnboDXp7R44OHbb4poEDIFU0_DHc00FL36ET12sA8xJvgcvmn9XNlzwt8Tzl4nqmg2bbCJYN8r14KgUz5-qqwwsVp8tvfwz8R2p3nm0ZLUwmMeOpKvrEmT_c4YtcStotEn_RBNFEeOICkyjYB7gxWbvOENUwBu0BzHUOfKW5IXhZKJv';

const DEFAULT_TAGS = ['mask', 'craft', 'galle', 'folklore', 'kolam', 'traditional'];

const QUIZ_OPTIONS = [
  {
    id: 'A',
    text: 'Kaduru Wood (Wild Timber)',
    desc: 'Light, soft, and easy to carve with fine chisels; authentic for ceremonial wear.',
    isCorrect: true,
  },
  {
    id: 'B',
    text: 'Treated Industrial Mahogany',
    desc: 'Dense and heavy, causing fatigue and neck strain during sacred rituals.',
    isCorrect: false,
  },
  {
    id: 'C',
    text: 'Molded Synthetic Epoxy',
    desc: 'Modern plastic compound lacking ancestral consecration and handcraft artistry.',
    isCorrect: false,
  },
  {
    id: 'D',
    text: 'Imported Plywood Layers',
    desc: 'Prone to moisture warping and splitting along chemical glue seams.',
    isCorrect: false,
  },
];

export const VideoDetailScreen: React.FC<VideoDetailScreenProps> = ({
  post,
  onBack,
  onNavigateMap,
  onNavigateSearch,
  onSelectRelatedPost,
}) => {
  const [currentPost, setCurrentPost] = useState<any>(post);
  // Counts a view for the story being watched (re-runs when a related video is selected).
  useRecordStoryView(currentPost?.id);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(post?.likesCount ?? 1248);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [relatedItems, setRelatedItems] = useState<FeedItemResponse[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  const [quizData, setQuizData] = useState<{
    question: string;
    explanation: string;
    options: Array<{ id: string; text: string; desc: string; isCorrect: boolean }>;
  }>({
    question: 'Which traditional wood or natural material is historically required for authentic craft carving in this heritage?',
    explanation: 'Kaduru wood is lightweight and soft, seasoned in smoke to prevent decay. This makes it ideal for intricate carving and comfortable for dancers during rituals.',
    options: QUIZ_OPTIONS,
  });

  useEffect(() => {
    if (post) {
      setCurrentPost(post);
      setLikesCount(post.likesCount ?? 0);
      setSelectedAnswer(null);
    }
  }, [post]);

  useEffect(() => {
    if (currentPost?.id && !currentPost?.videoUrl && !currentPost?.mediaUrl) {
      homeApi
        .getFeedItems()
        .then(items => {
          const found = items.find(i => String(i.id) === String(currentPost.id));
          if (found && (found.videoUrl || (found as any).mediaUrl)) {
            setCurrentPost((prev: any) => ({ ...found, ...prev }));
          }
        })
        .catch(err => {
          console.log('Notice: could not load feed item for video detail:', err);
        });
    }
  }, [currentPost?.id]);

  useEffect(() => {
    if (currentPost?.id) {
      homeApi
        .getStoryQuiz(String(currentPost.id))
        .then(res => {
          if (res && res.question && res.options && res.options.length > 0) {
            setQuizData({
              question: res.question,
              explanation: res.explanation || 'Cultural knowledge is preserved through authentic practices and storytelling.',
              options: res.options.map((opt: any) => ({
                id: opt.optionKey,
                text: opt.optionText,
                desc: opt.description || '',
                isCorrect: opt.isCorrect ?? false,
              })),
            });
          }
        })
        .catch(err => {
          console.log('Notice: default quiz fallback for story:', err);
        });
    }
  }, [currentPost?.id]);

  useEffect(() => {
    const currentId = currentPost?.id;

    function fallbackFeedRelated() {
      homeApi
        .getFeedItems()
        .then(items => {
          const currentTags = currentPost?.tags || [];
          const filtered = items.filter(i => String(i.id) !== String(currentId));

          filtered.sort((a, b) => {
            const aTagMatch = a.tags?.some((t: string) => currentTags.includes(t)) ? 1 : 0;
            const bTagMatch = b.tags?.some((t: string) => currentTags.includes(t)) ? 1 : 0;
            return bTagMatch - aTagMatch;
          });

          setRelatedItems(filtered.slice(0, 4));
        })
        .catch(err => {
          console.log('Failed to fetch fallback related items:', err);
        });
    }

    if (currentId) {
      discoveryApi
        .getRelatedStories(String(currentId), 4)
        .then(stories => {
          if (stories && stories.length > 0) {
            const mapped: FeedItemResponse[] = stories.map(s => ({
              id: String(s.id),
              title: s.title,
              type: (s.type || 'video') as any,
              author: s.authorName || 'Elder Storyteller',
              location: s.district ? `${s.district}, ${s.region || 'Sri Lanka'}` : (s.region || 'Sri Lanka'),
              tags: s.tags || [],
              thumbnail: s.imageUrl || undefined,
              likesCount: s.likesCount || 0,
              commentsCount: s.commentsCount || 0,
              description: s.description || '',
              excerpt: s.description || '',
              duration: '4:20',
            }));
            setRelatedItems(mapped);
          } else {
            fallbackFeedRelated();
          }
        })
        .catch(() => fallbackFeedRelated());
    } else {
      fallbackFeedRelated();
    }
  }, [currentPost?.id]);

  const handleSelectRelated = (item: FeedItemResponse) => {
    if (onSelectRelatedPost) {
      onSelectRelatedPost(item);
    }
    setCurrentPost(item);
    setLikesCount(item.likesCount ?? 0);
    setLiked(false);
    setSelectedAnswer(null);
    setIsLoading(true);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    setTimeout(() => {
      setIsLoading(false);
    }, 400);
  };

  const handleLike = () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount(prev => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    if (currentPost?.id) {
      homeApi.likePost(String(currentPost.id)).catch(err => console.log('Like failed:', err));
    }
  };

  const handleShare = async () => {
    try {
      const shareTitle = currentPost?.title || currentPost?.name || 'LegacyLens Cultural Story';
      await Share.share({
        message: `Discover "${shareTitle}" on LegacyLens! Explore Sri Lanka's living heritage: https://legacylens.app/content/${currentPost?.id || 'story'}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const rawVideo = currentPost?.videoUrl || currentPost?.mediaUrl;
  const resolvedVideoUri = rawVideo && !rawVideo.startsWith('http')
    ? getMediaUrl(rawVideo.startsWith('/uploads/') ? rawVideo : (rawVideo.startsWith('uploads/') ? `/${rawVideo}` : `/uploads/${rawVideo.replace(/^\/+/, '')}`))
    : (rawVideo || '');
  const hasVideo = Boolean(resolvedVideoUri && resolvedVideoUri.trim().length > 0);

  const rawThumb = currentPost?.thumbnail || currentPost?.imageUrl;
  const thumbnail = rawThumb && !rawThumb.startsWith('http')
    ? getMediaUrl(rawThumb.startsWith('/uploads/') ? rawThumb : (rawThumb.startsWith('uploads/') ? `/${rawThumb}` : `/uploads/${rawThumb.replace(/^\/+/, '')}`))
    : (rawThumb || null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progressBarWidth, setProgressBarWidth] = useState(0);

  const source = hasVideo ? { uri: resolvedVideoUri } : null;
  const player = useVideoPlayer(source, (p: any) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.5;
    if (hasVideo) {
      p.play();
    }
  });

  // Auto-play video as soon as the screen is opened and video source is ready
  useEffect(() => {
    if (!player || !hasVideo) return;
    try {
      player.play();
    } catch (e) {
      // Ignored
    }
  }, [player, hasVideo, resolvedVideoUri]);

  useEffect(() => {
    if (!player || !hasVideo) return;
    const subscription = player.addListener('playingChange', (event: any) => {
      setIsPlaying(event.isPlaying);
    });
    const timeSubscription = player.addListener('timeUpdate', (event: any) => {
      setCurrentTimeSec(Math.floor(event.currentTime || 0));
      if (player.duration && player.duration > 0) {
        setDurationSec(Math.floor(player.duration));
      }
    });
    const endSubscription = player.addListener('playToEnd', () => {
      setIsPlaying(false);
      setShowControls(true);
    });
    return () => {
      subscription.remove();
      timeSubscription.remove();
      endSubscription.remove();
    };
  }, [player, hasVideo]);

  useEffect(() => {
    if (!player) return;
    player.muted = isMuted;
  }, [isMuted, player]);

  // When source changes, replace player source
  useEffect(() => {
    if (!player || !hasVideo) return;
    try {
      if (typeof player.replace === 'function' && source) {
        player.replace(source);
      }
    } catch (e) {
      // Ignored
    }
  }, [player, resolvedVideoUri]);

  // Auto-hide controls when video is playing
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && showControls) {
      timer = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, showControls]);

  // Pause playback on screen exit
  useEffect(() => {
    return () => {
      if (player) {
        try {
          player.pause();
        } catch (e) {}
      }
    };
  }, [player]);

  const togglePlayback = () => {
    if (!player || !hasVideo) return;
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const skipForward = () => {
    if (!player || !hasVideo) return;
    player.seekBy(10);
  };

  const skipBackward = () => {
    if (!player || !hasVideo) return;
    player.seekBy(-10);
  };

  const handleSeek = (evt: any) => {
    if (!player || !durationSec || progressBarWidth <= 0) return;
    const clickX = evt.nativeEvent.locationX;
    const percentage = Math.max(0, Math.min(1, clickX / progressBarWidth));
    const targetSec = percentage * durationSec;
    player.currentTime = targetSec;
    setCurrentTimeSec(Math.floor(targetSec));
  };

  const handleBack = () => {
    if (player) {
      try {
        player.pause();
      } catch (e) {}
    }
    onBack?.();
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const originalTitle = currentPost?.title || currentPost?.name || 'Traditional Cultural Story';
  const location = currentPost?.location || 'Western Sri Lanka';
  const duration = durationSec > 0 ? formatSeconds(durationSec) : (currentPost?.duration || '10:00');
  const author = currentPost?.author || currentPost?.name || 'Gurunnanse Yohan Helitha';
  const avatar = currentPost?.avatar || DEFAULT_AVATAR;
  const tags: string[] =
    currentPost?.tags && currentPost.tags.length > 0 ? currentPost.tags : DEFAULT_TAGS;
  const originalDescription =
    currentPost?.description ||
    currentPost?.excerpt ||
    currentPost?.content ||
    "Traditional cultural practices passed down across generations of Sri Lankan heritage.";
  // Title and description are user-written: show them in the reader's language (original one tap away).
  const { texts: shownTexts, translated, showOriginal, toggleOriginal } = useTranslatedTexts([originalTitle, originalDescription]);
  const [title, description] = shownTexts;
  const keeperRole = currentPost?.elder ? 'Knowledge Keeper & Elder' : 'Traditional Master Craftsman';

  return (
    <View style={styles.flex1}>
      <CommentModal
        visible={commentModalVisible}
        onClose={() => setCommentModalVisible(false)}
        postId={String(currentPost?.id || 'video_1')}
      />

      {/* Top App Bar Overlay */}
      <SafeAreaView style={styles.headerOverlay} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleBack}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white }}>
          <ActivityIndicator size="large" color={Colors.secondary} />
          <Text style={{ marginTop: 16, fontFamily: Typography.fontBodyMed, color: Colors.textMuted }}>
            Loading story...
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Media Player */}
          <View style={styles.heroVideo}>
            {/* Cultural thumbnail rendered underneath only if provided */}
            {thumbnail ? (
              <Image
                source={{ uri: thumbnail }}
                style={[
                  StyleSheet.absoluteFill,
                  { opacity: isPlaying ? 0 : 0.85 }
                ]}
                resizeMode="cover"
              />
            ) : null}

            {/* Real video player when video exists in DB */}
            {hasVideo && (
              <VideoView
                player={player}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                nativeControls={false}
              />
            )}

            {/* Tap area to toggle overlay controls */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setShowControls(prev => !prev)}
              style={[
                styles.videoOverlay,
                {
                  opacity: showControls ? 1 : 0,
                }
              ]}
            >
              {/* Top Controls: Mute button */}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                {hasVideo && (
                  <TouchableOpacity
                    style={styles.smallIconBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      setIsMuted(prev => !prev);
                    }}
                  >
                    <MaterialIcons
                      name={isMuted ? 'volume-off' : 'volume-up'}
                      size={20}
                      color={Colors.white}
                    />
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ flex: 1 }} />

              {/* Center Controls: Skip -10s, Play/Pause, Skip +10s */}
              <View style={[styles.centerPlayBtnBox, { flexDirection: 'row', gap: 32 }]}>
                <TouchableOpacity
                  style={{ padding: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 28 }}
                  onPress={(e) => {
                    e.stopPropagation();
                    skipBackward();
                  }}
                  disabled={!hasVideo}
                >
                  <MaterialIcons name="replay-10" size={28} color={Colors.white} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.playBtnLarge}
                  onPress={(e) => {
                    e.stopPropagation();
                    togglePlayback();
                  }}
                  disabled={!hasVideo}
                >
                  <MaterialIcons
                    name={isPlaying ? 'pause' : 'play-arrow'}
                    size={40}
                    color={Colors.white}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ padding: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 28 }}
                  onPress={(e) => {
                    e.stopPropagation();
                    skipForward();
                  }}
                  disabled={!hasVideo}
                >
                  <MaterialIcons name="forward-10" size={28} color={Colors.white} />
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1 }} />

              {/* Bottom Controls: Progress Bar & Duration */}
              <View style={styles.bottomControls}>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleSeek(e);
                  }}
                  onLayout={(e) => setProgressBarWidth(e.nativeEvent.layout.width)}
                  style={styles.progressBarBg}
                >
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: durationSec > 0
                          ? `${Math.min(100, Math.max(0, (currentTimeSec / durationSec) * 100))}%`
                          : '0%'
                      }
                    ]}
                  >
                    <View style={styles.progressHandle} />
                  </View>
                </TouchableOpacity>
                <View style={styles.timeRow}>
                  <Text style={styles.timeText}>{formatSeconds(currentTimeSec)}</Text>
                  <Text style={styles.timeText}>
                    {durationSec > 0 ? formatSeconds(durationSec) : duration}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.contentBody}>
            {/* Title & Meta */}
            <View style={styles.titleSection}>
              <Text style={styles.mainTitle}>{title}</Text>
              {translated && <TranslationToggle showOriginal={showOriginal} onPress={toggleOriginal} />}

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <MaterialIcons name="location-on" size={16} color={Colors.secondary} />
                  <Text style={styles.metaText}>{location}</Text>
                </View>
                <View style={styles.metaItem}>
                  <MaterialIcons name="schedule" size={16} color={Colors.secondary} />
                  <Text style={styles.metaText}>{duration}</Text>
                </View>
              </View>

              {/* Author Info */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
                <AvatarPlaceholder
                  name={author}
                  avatarUrl={currentPost?.avatar}
                  size={40}
                  theme="light"
                />
                <View>
                  <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 14, fontWeight: '700', color: Colors.text }}>
                    {author}
                  </Text>
                  <Text style={{ fontFamily: Typography.fontBody, fontSize: 12, color: Colors.textMuted }}>
                    {keeperRole}
                  </Text>
                </View>
              </View>

              {/* Post Tags */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 12 }}>
                {tags.map((tag: string) => (
                  <TouchableOpacity
                    key={tag}
                    style={{
                      backgroundColor: 'rgba(254, 137, 62, 0.1)',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: 'rgba(254, 137, 62, 0.2)',
                    }}
                    onPress={() => onNavigateSearch?.('#' + tag)}
                  >
                    <Text style={{ fontSize: 12, color: Colors.accent, fontFamily: Typography.fontBodyMed }}>
                      #{tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Row */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
                <MaterialIcons
                  name={liked ? 'favorite' : 'favorite-outline'}
                  size={24}
                  color={liked ? '#FF4B4B' : Colors.textMuted}
                />
                <Text style={liked ? styles.actionBtnTextDark : styles.actionBtnText}>{likesCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setCommentModalVisible(true)}>
                <MaterialIcons name="forum" size={24} color={Colors.textMuted} />
                <Text style={styles.actionBtnText}>Comments</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setSaved(!saved)}>
                <MaterialIcons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={24}
                  color={saved ? '#fe893e' : Colors.textMuted}
                />
                <Text style={styles.actionBtnText}>{saved ? 'Saved' : 'Save'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                <MaterialIcons name="share" size={24} color={Colors.textMuted} />
                <Text style={styles.actionBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
            
            {/* Knowledge Keeper Profile */}
            <View style={styles.section}>
              <View style={styles.profileCard}>
                <View style={styles.profileDeco} />
                <View style={styles.rowCenterHead}>
                  <MaterialIcons name="psychology" size={18} color={Colors.secondary} />
                  <Text style={styles.profileHeadText}>KNOWLEDGE KEEPER</Text>
                </View>
                <View style={styles.profileInfoRow}>
                  <AvatarPlaceholder
                    name={author}
                    avatarUrl={currentPost?.avatar}
                    size={52}
                    theme="teal"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.profileName}>{author}</Text>
                    <Text style={styles.profileRole}>{keeperRole}</Text>
                  </View>
                </View>
                <View style={styles.quoteBox}>
                  <Text style={styles.quoteMark}>"</Text>
                  <Text style={styles.quoteText}>
                    Every rhythm, weave, and cut carries the breath of our ancestors. When we remember, our heritage stays alive.
                  </Text>
                </View>
              </View>
            </View>

            {/* Cultural Context */}
            <View style={styles.section}>
              <View style={styles.contextHeader}>
                <View style={styles.contextLine} />
                <Text style={styles.sectionTitle}>Why This Matters</Text>
              </View>
              <View style={styles.contextBody}>
                <Text style={styles.bodyText}>{description}</Text>
              </View>
            </View>

            {/* Bento Grid */}
            <View style={styles.section}>
              <Text style={styles.sectionSubhead}>Places & Artifacts</Text>
              <View style={styles.bentoRow}>
                <TouchableOpacity
                  style={styles.bentoCardSmall}
                  activeOpacity={0.8}
                  onPress={() => onNavigateMap?.(location || 'Southern Province')}
                >
                  <View style={{ position: 'absolute', top: 12, right: 12 }}>
                    <MaterialIcons name="chevron-right" size={24} color={Colors.textMuted} />
                  </View>
                  <View style={styles.bentoIconSecondary}>
                    <MaterialIcons name="location-on" size={20} color={Colors.accent} />
                  </View>
                  <Text style={styles.bentoTitle} numberOfLines={1}>{location.split(',')[0] || 'Heritage Site'}</Text>
                  <Text style={styles.bentoDesc}>Cultural Location</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.bentoCardSmall}
                  activeOpacity={0.8}
                  onPress={() => onNavigateSearch?.(tags.join(' '))}
                >
                  <View style={{ position: 'absolute', top: 12, right: 12 }}>
                    <MaterialIcons name="chevron-right" size={24} color={Colors.textMuted} />
                  </View>
                  <View style={styles.bentoIconTertiary}>
                    <MaterialIcons name="theater-comedy" size={20} color="#363c42" />
                  </View>
                  <Text style={styles.bentoTitle} numberOfLines={1}>
                    {tags[0] ? tags[0].toUpperCase() : 'HERITAGE'}
                  </Text>
                  <Text style={styles.bentoDesc}>Living Tradition</Text>
                </TouchableOpacity>
              </View>
            </View>

            
            {/* Related Videos */}
            <View style={styles.section}>
              <Text style={styles.sectionSubhead}>Related Cultural Stories</Text>
              <View style={styles.clipList}>
                {relatedItems.length > 0 ? (
                  relatedItems.map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.clipCard}
                      activeOpacity={0.8}
                      onPress={() => handleSelectRelated(item)}
                    >
                      <View style={styles.clipImgBox}>
                        <Image
                          source={{
                            uri:
                              item.thumbnail ||
                              item.avatar ||
                              'https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?q=80&w=600',
                          }}
                          style={styles.fullImg}
                        />
                        <View style={styles.clipPlayOverlay}>
                          <MaterialIcons name="play-arrow" size={20} color={Colors.white} />
                        </View>
                      </View>
                      <View style={styles.clipInfo}>
                        <Text style={styles.clipTitle} numberOfLines={1}>
                          {item.title || item.name}
                        </Text>
                        <View style={styles.clipTimestamp}>
                          <Text style={styles.clipTimestampText}>{item.duration || 'Video'}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <TouchableOpacity
                    style={styles.clipCard}
                    activeOpacity={0.8}
                    onPress={() => {}}
                  >
                    <View style={styles.clipImgBox}>
                      <Image
                        source={{
                          uri: 'https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?q=80&w=600',
                        }}
                        style={styles.fullImg}
                      />
                      <View style={styles.clipPlayOverlay}>
                        <MaterialIcons name="play-arrow" size={20} color={Colors.white} />
                      </View>
                    </View>
                    <View style={styles.clipInfo}>
                      <Text style={styles.clipTitle} numberOfLines={1}>
                        Beeralu Lace Weaving in Galle
                      </Text>
                      <View style={styles.clipTimestamp}>
                        <Text style={styles.clipTimestampText}>14:05</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};
