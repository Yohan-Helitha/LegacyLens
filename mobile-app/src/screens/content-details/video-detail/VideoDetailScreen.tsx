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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography } from '../../../theme';
import { CommentModal } from '../../../components/common/CommentModal';
import { homeApi, FeedItemResponse } from '../../../services/api/homeApi';
import { styles } from './VideoDetailScreen.styles';

export interface VideoDetailScreenProps {
  post?: any;
  onBack?: () => void;
  onNavigateMap?: (location: string) => void;
  onNavigateSearch?: (query: string) => void;
  onSelectRelatedPost?: (post: any) => void;
}

const DEFAULT_THUMBNAIL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC3_7Gy9V7Y2pFoWnM9ULHdHgWArTQoArPOynphh9T30ARMNnoyeJpe5ejMxpZWkmgnoLPfa_iL0K5H4HfAMK0cpA3l9pUqfqXLhgz7AiHwx_vsfYgKAbHdOPj7DRwR2UoeA-o1CQx_AGm2iUn3YWGbW_azg69lTjQW6TnUU1tMaHaCVN2w0CBlw1o42aLuBAQbhbkvmUA0nHY9aTdX-LbjXfCIduBMpVY44eQvNr5bDCwNIEmFq7-p';

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
      setLikesCount(post.likesCount ?? 1248);
      setSelectedAnswer(null);
    }
  }, [post]);

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
    homeApi
      .getFeedItems()
      .then(items => {
        const currentId = currentPost?.id;
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
        console.log('Failed to fetch related items:', err);
      });
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

  const title = currentPost?.title || currentPost?.name || 'The Last Traditional Mask Maker of Ambalangoda';
  const location = currentPost?.location || 'Ambalangoda, Southern Sri Lanka';
  const duration = currentPost?.duration || '14m 32s';
  const author = currentPost?.author || currentPost?.name || 'Somapala Perera';
  const avatar = currentPost?.avatar || DEFAULT_AVATAR;
  const thumbnail = currentPost?.thumbnail || DEFAULT_THUMBNAIL;
  const tags: string[] =
    currentPost?.tags && currentPost.tags.length > 0 ? currentPost.tags : DEFAULT_TAGS;
  const description =
    currentPost?.description ||
    currentPost?.excerpt ||
    currentPost?.content ||
    "Ambalangoda is the historic heartland of Sri Lankan traditional mask making. These aren't merely decorative items; they are essential ritual implements used in Sanni Yakuma (healing rituals) and Kolam (comedic folk plays). The craft relies on specific timber (Kaduru wood) and strict proportional guidelines passed down orally across generations.";
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
          <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
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
            <ImageBackground source={{ uri: thumbnail }} style={styles.heroImg}>
              <View style={styles.videoOverlay}>
                <View style={{ flex: 1 }} />
                <View style={[styles.centerPlayBtnBox, { flexDirection: 'row', gap: 32 }]}>
                  <TouchableOpacity
                    style={{ padding: 12, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 24 }}
                  >
                    <MaterialIcons name="replay-10" size={28} color={Colors.white} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.playBtnLarge}>
                    <MaterialIcons name="play-arrow" size={40} color={Colors.white} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ padding: 12, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 24 }}
                  >
                    <MaterialIcons name="forward-10" size={28} color={Colors.white} />
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }} />

                <View style={styles.bottomControls}>
                  <View style={styles.progressBarBg}>
                    <View style={styles.progressBarFill}>
                      <View style={styles.progressHandle} />
                    </View>
                  </View>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeText}>00:00</Text>
                    <Text style={styles.timeText}>{duration}</Text>
                  </View>
                </View>
              </View>
            </ImageBackground>
          </View>

          <View style={styles.contentBody}>
            {/* Title & Meta */}
            <View style={styles.titleSection}>
              <Text style={styles.mainTitle}>{title}</Text>

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
                <Image source={{ uri: avatar }} style={{ width: 40, height: 40, borderRadius: 20 }} />
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

            {/* Chapter Navigator */}
            <View style={styles.section}>
              <Text style={styles.sectionSubhead}>Jump into the Story</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                <TouchableOpacity style={styles.chapterCardActive}>
                  <View style={styles.chapterProgressBg}>
                    <View style={styles.chapterProgressFill} />
                  </View>
                  <Text style={styles.chapterTitleActive} numberOfLines={1}>
                    The Village
                  </Text>
                  <Text style={styles.chapterTimeActive}>0:00</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.chapterCard}>
                  <View style={styles.chapterProgressBg} />
                  <Text style={styles.chapterTitle} numberOfLines={1}>
                    The Craftsman
                  </Text>
                  <Text style={styles.chapterTime}>2:15</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.chapterCard}>
                  <View style={styles.chapterProgressBg} />
                  <Text style={styles.chapterTitle} numberOfLines={1}>
                    The Craft
                  </Text>
                  <Text style={styles.chapterTime}>5:42</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.chapterCard}>
                  <View style={styles.chapterProgressBg} />
                  <Text style={styles.chapterTitle} numberOfLines={1}>
                    The Meaning
                  </Text>
                  <Text style={styles.chapterTime}>9:10</Text>
                </TouchableOpacity>
              </ScrollView>
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
                  <View style={styles.profileAvatarBox}>
                    <Image source={{ uri: avatar }} style={styles.fullImg} />
                  </View>
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

            {/* Quiz: 4 options with 1 correct and 3 wrong with rich descriptions */}
            <View style={styles.section}>
              <View style={styles.quizCard}>
                <View style={styles.quizDeco} />
                <View style={styles.quizHeader}>
                  <View style={styles.rowCenter}>
                    <MaterialIcons name="psychology" size={24} color={Colors.accent} />
                    <Text style={styles.quizTitle}>Knowledge Check</Text>
                  </View>
                </View>
                <Text style={styles.quizQuestion}>
                  {quizData.question}
                </Text>

                <View style={styles.quizOptions}>
                  {quizData.options.map(opt => {
                    const isSelected = selectedAnswer === opt.id;
                    const showResult = selectedAnswer !== null;

                    let bgColor = 'rgba(255,255,255,0.05)';
                    let borderColor = 'rgba(255,255,255,0.1)';
                    if (showResult) {
                      if (opt.isCorrect) {
                        bgColor = 'rgba(76, 175, 80, 0.2)';
                        borderColor = '#4CAF50';
                      } else if (isSelected) {
                        bgColor = 'rgba(244, 67, 54, 0.2)';
                        borderColor = '#F44336';
                      }
                    } else if (isSelected) {
                      borderColor = Colors.accent;
                    }

                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[
                          styles.quizOptionBtn,
                          {
                            backgroundColor: bgColor,
                            borderColor,
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            paddingVertical: 12,
                          },
                        ]}
                        onPress={() => !showResult && setSelectedAnswer(opt.id)}
                        disabled={showResult}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                          <Text
                            style={[
                              styles.quizOptionText,
                              showResult && opt.isCorrect && { color: '#4CAF50', fontWeight: 'bold' },
                              showResult && isSelected && !opt.isCorrect && { color: '#F44336', fontWeight: 'bold' },
                            ]}
                          >
                            {opt.text}
                          </Text>
                          {showResult && opt.isCorrect && (
                            <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                          )}
                          {showResult && isSelected && !opt.isCorrect && (
                            <MaterialIcons name="cancel" size={20} color="#F44336" />
                          )}
                          {!showResult && (
                            <View
                              style={[
                                styles.quizRadio,
                                isSelected && { backgroundColor: Colors.accent },
                              ]}
                            />
                          )}
                        </View>
                        {!!opt.desc && (
                          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                            {opt.desc}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {!!selectedAnswer && (
                  <View style={styles.quizExplanationBox}>
                    <Text style={styles.quizExplanationText}>
                      <Text
                        style={{
                          color:
                            quizData.options.find(o => o.id === selectedAnswer)?.isCorrect
                              ? '#4CAF50'
                              : '#F44336',
                          fontWeight: 'bold',
                        }}
                      >
                        {quizData.options.find(o => o.id === selectedAnswer)?.isCorrect
                          ? 'Correct! '
                          : 'Incorrect. '}
                      </Text>
                      <Text>
                        {quizData.explanation}
                      </Text>
                    </Text>
                  </View>
                )}
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
