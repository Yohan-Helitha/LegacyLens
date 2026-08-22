import React, { useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Image,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../theme';
import { CommentModal } from '../../../components/common/CommentModal';
import { styles } from './VideoDetailScreen.styles';

export const VideoDetailScreen: React.FC<{ 
  onBack?: () => void; 
  onNavigateMap?: (location: string) => void;
  onNavigateSearch?: (query: string) => void;
}> = ({ onBack, onNavigateMap, onNavigateSearch }) => {
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const simulateVideoNavigation = () => {
    setIsLoading(true);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };
  const [likesCount, setLikesCount] = useState(1248);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const handleLike = () => {
    setLiked(!liked);
    setLikesCount(prev => liked ? prev - 1 : prev + 1);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Check out this video on LegacyLens! https://legacylens.app/video/mask-maker',
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.flex1}>
      <CommentModal 
        visible={commentModalVisible} 
        onClose={() => setCommentModalVisible(false)} 
        postId="video_1" 
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
          <Text style={{ marginTop: 16, fontFamily: Typography.fontBodyMed, color: Colors.textMuted }}>Loading video...</Text>
        </View>
      ) : (
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Hero Video Player */}
        <View style={styles.heroVideo}>
          <ImageBackground source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3_7Gy9V7Y2pFoWnM9ULHdHgWArTQoArPOynphh9T30ARMNnoyeJpe5ejMxpZWkmgnoLPfa_iL0K5H4HfAMK0cpA3l9pUqfqXLhgz7AiHwx_vsfYgKAbHdOPj7DRwR2UoeA-o1CQx_AGm2iUn3YWGbW_azg69lTjQW6TnUU1tMaHaCVN2w0CBlw1o42aLuBAQbhbkvmUA0nHY9aTdX-LbjXfCIduBMpVY44eQvNr5bDCwNIEmFq7-p' }} style={styles.heroImg}>
            <View style={styles.videoOverlay}>
              {/* Removed topActionsRow */}
              <View style={{ flex: 1 }} />
              <View style={[styles.centerPlayBtnBox, { flexDirection: 'row', gap: 32 }]}>
                <TouchableOpacity style={{ padding: 12, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 24 }}>
                  <MaterialIcons name="replay-10" size={28} color={Colors.white} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.playBtnLarge}>
                  <MaterialIcons name="play-arrow" size={40} color={Colors.white} />
                </TouchableOpacity>
                <TouchableOpacity style={{ padding: 12, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 24 }}>
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
                  <Text style={styles.timeText}>05:42</Text>
                  <Text style={styles.timeText}>14:32</Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.contentBody}>
          {/* Title & Meta */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>The Last Traditional Mask Maker of Ambalangoda</Text>
            
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <MaterialIcons name="location-on" size={16} color={Colors.secondary} />
                <Text style={styles.metaText}>Ambalangoda, Southern Sri Lanka</Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialIcons name="schedule" size={16} color={Colors.secondary} />
                <Text style={styles.metaText}>14m 32s</Text>
              </View>
            </View>

            {/* Author Info */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
              <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJddldj0j2P6Ei0-tjnizjoCg7UTQFEOj4JzzD3cvcqYCb7ul1d5DrS0zO1zyjB5y9jdTionnboDXp7R44OHbb4poEDIFU0_DHc00FL36ET12sA8xJvgcvmn9XNlzwt8Tzl4nqmg2bbCJYN8r14KgUz5-qqwwsVp8tvfwz8R2p3nm0ZLUwmMeOpKvrEmT_c4YtcStotEn_RBNFEeOICkyjYB7gxWbvOENUwBu0BzHUOfKW5IXhZKJv' }} style={{ width: 40, height: 40, borderRadius: 20 }} />
              <View>
                <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 14, fontWeight: '700', color: Colors.text }}>Somapala Perera</Text>
                <Text style={{ fontFamily: Typography.fontBody, fontSize: 12, color: Colors.textMuted }}>Traditional Mask Maker</Text>
              </View>
            </View>
            
            {/* Post Tags */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 12 }}>
              {['mask', 'craft', 'galle', 'folklore', 'kolam', 'traditional'].map(tag => (
                <TouchableOpacity 
                  key={tag} 
                  style={{ backgroundColor: 'rgba(254, 137, 62, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(254, 137, 62, 0.2)' }}
                  onPress={() => onNavigateSearch?.('#sanniyakuma #mask #craft #galle #folklore #kolam #traditional')}
                >
                  <Text style={{ fontSize: 12, color: Colors.accent, fontFamily: Typography.fontBodyMed }}>#{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
              <MaterialIcons name={liked ? "favorite" : "favorite-outline"} size={24} color={liked ? "#FF4B4B" : Colors.textMuted} />
              <Text style={liked ? styles.actionBtnTextDark : styles.actionBtnText}>{likesCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setCommentModalVisible(true)}>
              <MaterialIcons name="forum" size={24} color={Colors.textMuted} />
              <Text style={styles.actionBtnText}>Comments</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setSaved(!saved)}>
              <MaterialIcons name={saved ? "bookmark" : "bookmark-outline"} size={24} color={saved ? "#fe893e" : Colors.textMuted} />
              <Text style={styles.actionBtnText}>{saved ? "Saved" : "Save"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <MaterialIcons name="share" size={24} color={Colors.textMuted} />
              <Text style={styles.actionBtnText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Chapter Navigator */}
          <View style={styles.section}>
            <Text style={styles.sectionSubhead}>Jump into the Story</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              <TouchableOpacity style={styles.chapterCardActive}>
                <View style={styles.chapterProgressBg}><View style={styles.chapterProgressFill} /></View>
                <Text style={styles.chapterTitleActive} numberOfLines={1}>The Village</Text>
                <Text style={styles.chapterTimeActive}>0:00</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chapterCard}>
                <View style={styles.chapterProgressBg} />
                <Text style={styles.chapterTitle} numberOfLines={1}>The Craftsman</Text>
                <Text style={styles.chapterTime}>2:15</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chapterCard}>
                <View style={styles.chapterProgressBg} />
                <Text style={styles.chapterTitle} numberOfLines={1}>The Craft</Text>
                <Text style={styles.chapterTime}>5:42</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chapterCard}>
                <View style={styles.chapterProgressBg} />
                <Text style={styles.chapterTitle} numberOfLines={1}>The Meaning</Text>
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
                  <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJddldj0j2P6Ei0-tjnizjoCg7UTQFEOj4JzzD3cvcqYCb7ul1d5DrS0zO1zyjB5y9jdTionnboDXp7R44OHbb4poEDIFU0_DHc00FL36ET12sA8xJvgcvmn9XNlzwt8Tzl4nqmg2bbCJYN8r14KgUz5-qqwwsVp8tvfwz8R2p3nm0ZLUwmMeOpKvrEmT_c4YtcStotEn_RBNFEeOICkyjYB7gxWbvOENUwBu0BzHUOfKW5IXhZKJv' }} style={styles.fullImg} />
                </View>
                <View>
                  <Text style={styles.profileName}>Somapala Perera</Text>
                  <Text style={styles.profileRole}>Traditional Mask Maker</Text>
                </View>
              </View>
              <View style={styles.quoteBox}>
                <Text style={styles.quoteMark}>"</Text>
                <Text style={styles.quoteText}>My father taught me this craft when I was twelve. Every cut in the wood must carry the breath of the ancestors.</Text>
              </View>
            </View>
          </View>

          {/* Interactive Button Removed */}

          {/* Cultural Context */}
          <View style={styles.section}>
            <View style={styles.contextHeader}>
              <View style={styles.contextLine} />
              <Text style={styles.sectionTitle}>Why This Matters</Text>
            </View>
            <View style={styles.contextBody}>
              <Text style={styles.bodyText}>
                Ambalangoda is the historic heartland of Sri Lankan traditional mask making. These aren't merely decorative items; they are essential ritual implements used in <Text style={styles.boldText}>Sanni Yakuma</Text> (healing rituals) and <Text style={styles.boldText}>Kolam</Text> (comedic folk plays). The craft relies on specific timber (Kaduru wood) and strict proportional guidelines passed down orally across generations.
              </Text>
            </View>
          </View>

          {/* Bento Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionSubhead}>{'Places & Artifacts'}</Text>
            <View style={styles.bentoRow}>
              <TouchableOpacity style={styles.bentoCardSmall} activeOpacity={0.8} onPress={() => onNavigateMap?.('Southern Province')}>
                <View style={{ position: 'absolute', top: 12, right: 12 }}>
                  <MaterialIcons name="chevron-right" size={24} color={Colors.textMuted} />
                </View>
                <View style={styles.bentoIconSecondary}><MaterialIcons name="location-on" size={20} color={Colors.accent} /></View>
                <Text style={styles.bentoTitle}>Ambalangoda</Text>
                <Text style={styles.bentoDesc}>Coastal Town</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bentoCardSmall} activeOpacity={0.8} onPress={() => onNavigateSearch?.('#sanniyakuma #mask #craft #galle #folklore #kolam #traditional')}>
                <View style={{ position: 'absolute', top: 12, right: 12 }}>
                  <MaterialIcons name="chevron-right" size={24} color={Colors.textMuted} />
                </View>
                <View style={styles.bentoIconTertiary}><MaterialIcons name="theater-comedy" size={20} color="#363c42" /></View>
                <Text style={styles.bentoTitle}>Sanni Yakuma</Text>
                <Text style={styles.bentoDesc}>Healing Ritual</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quiz */}
          <View style={styles.section}>
            <View style={styles.quizCard}>
              <View style={styles.quizDeco} />
              <View style={styles.quizHeader}>
                <View style={styles.rowCenter}>
                  <MaterialIcons name="psychology" size={24} color={Colors.accent} />
                  <Text style={styles.quizTitle}>Knowledge Check</Text>
                </View>
              </View>
              <Text style={styles.quizQuestion}>Which type of wood is traditionally required to carve these specific masks?</Text>
              
              <View style={styles.quizOptions}>
                {['Teak', 'Kaduru Wood', 'Mahogany'].map(option => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === 'Kaduru Wood';
                  const showResult = selectedAnswer !== null;
                  
                  let bgColor = 'rgba(255,255,255,0.05)';
                  let borderColor = 'rgba(255,255,255,0.1)';
                  if (showResult) {
                    if (isCorrect) {
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
                      key={option}
                      style={[styles.quizOptionBtn, { backgroundColor: bgColor, borderColor }]}
                      onPress={() => !showResult && setSelectedAnswer(option)}
                      disabled={showResult}
                    >
                      <Text style={[styles.quizOptionText, showResult && isCorrect && { color: '#4CAF50', fontWeight: 'bold' }]}>{option}</Text>
                      {showResult && isCorrect && <MaterialIcons name="check-circle" size={20} color="#4CAF50" />}
                      {showResult && isSelected && !isCorrect && <MaterialIcons name="cancel" size={20} color="#F44336" />}
                      {!showResult && <View style={[styles.quizRadio, isSelected && { backgroundColor: Colors.accent }]} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {selectedAnswer && (
                <View style={styles.quizExplanationBox}>
                  <Text style={styles.quizExplanationText}>
                    <Text style={{ color: selectedAnswer === 'Kaduru Wood' ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}>
                      {selectedAnswer === 'Kaduru Wood' ? 'Correct! ' : 'Incorrect. '}
                    </Text>
                    <Text>{"Kaduru wood is extremely light and soft, making it the traditional choice for these intricate, wearable masks."}</Text>
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Related Videos */}
          <View style={styles.section}>
            <Text style={styles.sectionSubhead}>Related Videos</Text>
            <View style={styles.clipList}>
              <TouchableOpacity style={styles.clipCard} activeOpacity={0.8} onPress={simulateVideoNavigation}>
                <View style={styles.clipImgBox}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?q=80&w=600' }} style={styles.fullImg} />
                  <View style={styles.clipPlayOverlay}><MaterialIcons name="play-arrow" size={20} color={Colors.white} /></View>
                </View>
                <View style={styles.clipInfo}>
                  <Text style={styles.clipTitle} numberOfLines={1}>Beeralu Lace Weaving in Galle</Text>
                  <View style={styles.clipTimestamp}><Text style={styles.clipTimestampText}>14:05</Text></View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.clipCard} activeOpacity={0.8} onPress={simulateVideoNavigation}>
                <View style={styles.clipImgBox}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1461696114087-397271a7aedc?q=80&w=600' }} style={styles.fullImg} />
                  <View style={styles.clipPlayOverlay}><MaterialIcons name="play-arrow" size={20} color={Colors.white} /></View>
                </View>
                <View style={styles.clipInfo}>
                  <Text style={styles.clipTitle} numberOfLines={1}>Brass Crafting in Pilimathalawa</Text>
                  <View style={styles.clipTimestamp}><Text style={styles.clipTimestampText}>11:30</Text></View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      )}

      {/* Floating Action Bar */}    </View>
  );
};
