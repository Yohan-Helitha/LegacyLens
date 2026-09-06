import React, { useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Image,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../theme';
import { styles } from './BlogDetailScreen.styles';
import { Share } from 'react-native';

export const BlogDetailScreen: React.FC<{ onBack?: () => void; onNavigateSearch?: (query: string) => void }> = ({ onBack, onNavigateSearch }) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [vocabOpen, setVocabOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [fontScale, setFontScale] = useState(1); // 1, 1.15, 1.3

  const handleShare = async () => {
    try {
      await Share.share({ message: 'Check out this cultural story on LegacyLens! https://legacylens.app/story/matara' });
    } catch (error) {
      console.log(error);
    }
  };

  const toggleFontSize = () => {
    setFontScale(prev => (prev === 1 ? 1.15 : prev === 1.15 ? 1.3 : 1));
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const maxScroll = contentSize.height - layoutMeasurement.height;
    if (maxScroll <= 0) return;
    const progress = Math.min(Math.max(contentOffset.y / maxScroll, 0), 1);
    setScrollProgress(progress);
  };

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
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Editorial Hero */}
        <View style={styles.heroSection}>
          <ImageBackground source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWWJlYXpewMIZpZG7wy2BTuR--kPcTGAYt_FpeSIlJC925IkFiCTzSTcMO3FuW2hyXPougXy5xZzqL7wosDMVm1I0dazWP4IByRSPIIOep_BmfB9aBz-LCbTFNySven1gHh5HQO6LWElMn26vNjgBUPMa5d5ZuddDiXkmL5O7ImnFCFzVetzI0q32q1ES6aLGDH9Vifgf6D7LsIm6rfRVpy47b6NnmR78suD8VaTCd5s_Ux-IfD-Pm' }} style={styles.heroImg}>
            <View style={styles.heroGradient}>
              <View style={styles.heroContent}>
                <View style={styles.heroTags}>
                  <View style={styles.heroTagBorder}><Text style={styles.heroTagText}>Matara, Sri Lanka</Text></View>
                  <View style={styles.heroTagSolid}><Text style={styles.heroTagTextSolid}>Craft Tradition</Text></View>
                </View>
                <Text style={styles.heroTitle}>The Last Hands That Still Remember</Text>
                
                <View style={styles.authorRow}>
                  <View style={styles.authorGroup}>
                    <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBwEVG3n4_qVeLpvR0JQTwY1F_K-fZEglPFRI9_t9HPn_IMdB39xj6QA5jv16VZ0Ha7h0rYrfI70Iy5p5dyXD1nWvlU-3H-4D_wdeDG2btOJcdiITai86vvb9s0DZu6TiGSZy0jtkLFFMilyFmm4HznJ9K7ry5FhvUUNoun0LzVFzpfF0eTHz6nSMJIL7xvT85vUVaTPd9aOQNH6HdrEHxSsRkTBKQ-34yxrrYGgYKZ4fDT44A3Ous5' }} style={styles.authorImg} />
                    <Text style={styles.authorName}>Nadeesha Perera</Text>
                  </View>
                  <View style={styles.dotSeparator} />
                  <View style={styles.timeGroup}>
                    <MaterialIcons name="schedule" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.timeText}>8 min read</Text>
                  </View>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* Content Area */}
        <View style={styles.bodyContent}>
          
          <View style={[styles.paragraph, { marginBottom: 4 }]}>
            <Text style={styles.dropCap}>T</Text>
            <Text style={[styles.bodyText, { fontSize: 19 * fontScale, lineHeight: 32 * fontScale }]}>he scent of dried rush grass hangs heavy in the humid afternoon air of Matara. Here, in the shaded veranda of a colonial-era home, Somawathi's hands move with a rhythm born of seventy years of repetition. They are hands that map a fading history, tracing patterns in reed that were once the lifeblood of southern coastal villages.</Text>
          </View>

          <Text style={[styles.bodyText, { fontSize: 19 * fontScale, lineHeight: 32 * fontScale, marginBottom: 8 }]}>Weaving is not merely a craft; it is an unspoken language passed down through generations of women. As she works, turning stiff pan (rush) into supple mats, she murmurs the counting patterns under her breath, a melodic chant that guides her fingers.</Text>

          {/* Cultural Context Aside */}
          <View style={styles.asideBox}>
            <View style={styles.asideDeco} />
            <View style={styles.asideHeaderRow}>
              <View style={styles.asideIconBox}><MaterialIcons name="info" size={20} color={Colors.white} /></View>
              <Text style={[styles.asideTitle, { fontSize: 16 * fontScale }]}>Pan Kalawa (Reed Weaving)</Text>
            </View>
            <Text style={[styles.asideText, { fontSize: 14 * fontScale, lineHeight: 24 * fontScale }]}>A traditional craft native to the Southern and Western provinces. Historically, the patterns woven into these mats (peduru) indicated social status, regional origin, and were vital dowry items. Today, less than 50 active master weavers remain.</Text>
          </View>

          <Text style={[styles.bodyText, { fontSize: 19 * fontScale, lineHeight: 32 * fontScale, marginBottom: 8 }]}>
            The process begins long before the weaving itself. It starts in the marshes, knee-deep in mud, harvesting the specific <Text style={[styles.vocabWord, { fontSize: 19 * fontScale }]} onPress={() => setVocabOpen(!vocabOpen)}>Gala</Text> rush. It requires a specific knowledge of seasons, lunar cycles, and the exact maturity of the stem.
          </Text>

          {/* Pull Quote */}
          <View style={styles.quoteBlock}>
            <MaterialIcons name="format-quote" size={40} color="rgba(254, 137, 62, 0.5)" style={{ marginBottom: 8 }} />
            <Text style={[styles.quoteText, { fontSize: 24 * fontScale, lineHeight: 34 * fontScale }]}>"When I weave, I am not just making a mat. I am sitting with my mother, and her mother before her. We are all holding the same thread of time."</Text>
            <View style={styles.quoteFooter}>
              <View style={styles.quoteLine} />
              <Text style={[styles.quoteAuthor, { fontSize: 14 * fontScale }]}>Somawathi, 72, Master Weaver</Text>
            </View>
          </View>

          {/* Image Section */}
          <View style={styles.lookCloserSection}>
            <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQTSggCxOtvHuniLkdwRdYlsFLvcyjKozoNm_a2ZsB6zoBec1jmoKLOhYt4ho6cgcr9fabuAAtJ61-cvCxfUyrZC2oLJbonkkL1a8FevbS_WBMQg2ypi3VPm6ACPmSqw-nmkQZQ0fz6dq_HIYpIaQyGo93tnQQRDIEqWjQN4oN4l0rD-21TEiNceE0-m5p7o5E2ynITGFCeb1FEzXKTS20Iuiv6LhS-n8ArOTFYSQHRKaGz2boZgr9' }} style={[styles.fullImg, { borderRadius: 16, height: 240 }]} />
            <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 13 * fontScale, color: Colors.textMuted, textAlign: 'center', marginTop: 8 }}>
              Traditional weaving tools passed down through generations.
            </Text>
          </View>

          <Text style={[styles.bodyText, { fontSize: 19 * fontScale, lineHeight: 32 * fontScale, marginBottom: 8 }]}>
            The intricate geometric patterns, often resembling flora, fauna, or abstract celestial bodies, are not drawn beforehand. They are memorized. A miscounted strand can ruin hours of labor. This mental math, this <Text style={[styles.vocabWord, { fontSize: 19 * fontScale }]} onPress={() => setVocabOpen(!vocabOpen)}>Kambiliya</Text> (pattern memory), is what is most at risk of being lost as younger generations move toward urban centers.
          </Text>

          {/* Vocab Popover */}
          {vocabOpen && (
            <View style={styles.vocabPopover}>
              <TouchableOpacity style={styles.vocabCloseBtn} onPress={() => setVocabOpen(false)}>
                <MaterialIcons name="close" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
              <View style={styles.vocabHeaderRow}>
                <Text style={styles.vocabTitle}>Kambiliya</Text>
                <View style={styles.vocabAudioBtn}><MaterialIcons name="volume-up" size={14} color={Colors.secondary} /></View>
              </View>
              <Text style={[styles.vocabPhonetic, { fontSize: 12 * fontScale }]}>කම්බිලිය • /kuhm-bi-li-yuh/</Text>
              <Text style={[styles.vocabDesc, { fontSize: 14 * fontScale }]}>The mental repository or inherited memory of complex weaving patterns, often taught through rhythmic chanting.</Text>
            </View>
          )}

          {/* Preservation Section */}
          <View style={styles.preservationBox}>
            <View style={styles.preservationHeader}>
              <Text style={[styles.preservationTitle, { fontSize: 24 * fontScale }]}>What This Story Preserves</Text>
            </View>
            <View style={styles.preservationList}>
              <View style={styles.preservationItem}>
                <MaterialIcons name="record-voice-over" size={24} color={Colors.accent} />
                <View style={styles.preservationInfo}>
                  <Text style={[styles.preservationItemTitle, { fontSize: 14 * fontScale }]}>Oral Knowledge</Text>
                  <Text style={[styles.preservationItemDesc, { fontSize: 14 * fontScale }]}>The counting chants used by weavers in the Southern Province.</Text>
                </View>
              </View>
              <View style={styles.preservationItem}>
                <MaterialIcons name="groups" size={24} color={Colors.accent} />
                <View style={styles.preservationInfo}>
                  <Text style={[styles.preservationItemTitle, { fontSize: 14 * fontScale }]}>Community Memory</Text>
                  <Text style={[styles.preservationItemDesc, { fontSize: 14 * fontScale }]}>The social structure of female artisan collectives in Matara before 1980.</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Explore Connections */}
          <View style={styles.exploreSection}>
            <Text style={[styles.exploreTitle, { fontSize: 14 * fontScale }]}>EXPLORE CONNECTIONS</Text>
            <View style={styles.exploreTags}>
              <TouchableOpacity style={styles.exploreTag} onPress={() => onNavigateSearch?.('Southern Village Life')}>
                <MaterialIcons name="holiday-village" size={16 * fontScale} color={Colors.secondary} />
                <Text style={[styles.exploreTagText, { fontSize: 12 * fontScale }]}>Southern Village Life</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exploreTag} onPress={() => onNavigateSearch?.('Traditional Household Objects')}>
                <MaterialIcons name="kitchen" size={16 * fontScale} color={Colors.secondary} />
                <Text style={[styles.exploreTagText, { fontSize: 12 * fontScale }]}>Traditional Household Objects</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exploreTag} onPress={() => onNavigateSearch?.('Colonial Era Trade')}>
                <MaterialIcons name="history" size={16 * fontScale} color={Colors.secondary} />
                <Text style={[styles.exploreTagText, { fontSize: 12 * fontScale }]}>Colonial Era Trade</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Guaranteed Bottom Spacer for Action Bar */}
          <View style={{ height: 550 }} />
        </View>
      </ScrollView>

      {/* Floating Reading Toolbar */}
      <View style={styles.toolbarContainer}>
        <View style={styles.toolbarInner}>
          <TouchableOpacity style={styles.toolbarBtn} onPress={() => setIsSaved(!isSaved)}>
            <MaterialIcons name={isSaved ? "bookmark" : "bookmark-add"} size={24} color={isSaved ? "#fe893e" : Colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.toolbarDivider} />
          <Text style={styles.toolbarProgressText}>{Math.round(scrollProgress * 100)}%</Text>
          <View style={styles.toolbarDivider} />
          <TouchableOpacity style={styles.toolbarBtn} onPress={toggleFontSize}>
            <MaterialIcons name="format-size" size={20} color={fontScale > 1 ? "#fe893e" : Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarBtnAccent} onPress={handleShare}>
            <MaterialIcons name="share" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};


