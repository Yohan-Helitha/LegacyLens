import React, { useState, useEffect } from 'react';
import {
  Text, View, ScrollView, TouchableOpacity,
  Image, StatusBar, Alert, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii } from '../../../theme';
import { styles } from './AdminHomeScreen.styles';
import { useOpportunity } from '../../../context/OpportunityContext';
import { useAuthStore } from '../../../store/authStore';

// ─── Data ───────────────────────────────────────────────────────────────────
const RECORDINGS_LIST = [
  {
    id: 'rec-1',
    name: 'Mrs. Sunethra Fernando',
    location: 'Galle',
    duration: '14 mins',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAw8_8bd1MoyfJOKvJlrxTI2jRbmuJbNjnMKw6zNr3QdMvvsfVqB6AXP74y7Ou5vKdO6sHAW129RAum1ATnF-2q5QtvTGrE3gGsHEANkAIOd1Mp04HlJxImdYnEtvYPfYnrGnQnL8oaKr3BsyMvpR4gGAMkr4qd_MFsWeYOaHtLlRLVSdUlfU_s0rLEGIGxZT7An4nSkXePTOC2uVGXDcRVRIiyPPuPYD4GJC8F4t7RGWdO9hT0vQp_',
    bars: [3, 2, 6, 4, 5, 3, 2, 4, 6],
    isNew: true,
  },
  {
    id: 'rec-2',
    name: 'Mrs. Kamala Wijesinghe',
    location: 'Matara',
    duration: '12 mins',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAH7-D0WjeNXK_Uvi1YZNypRZpKGGl9ARF1OKGCgjzzafTdzi8Ud7a87lLHmWiiVEq5vag2cvWWxwzmy3U9vqJrUCKglNcD31GjQoTz08zh1v8l_A0LQUFVwUPofpc3e2gWIjg-JTxerNyJTGxOUTfZzxS-ofTS1rkBaoNyoWQD_uP-wC8BSVLAfVekBtK4CMvHbz429JBR8A--jPYPo-JYjldjylfqD5YdNb57YR8okDiLlN7_u0PG',
    bars: [2, 4, 3, 5, 2, 6, 4, 2, 3, 5, 2],
  },
  {
    id: 'rec-3',
    name: 'Mr. Saman Perera',
    location: 'Kandy',
    duration: '8 mins',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkWtss9TvtEwCHV7GoEnjdFV5qyjJJ1Q4tWHFQcEdiWpHtWNKUTWyVbgiDPRYYo9Bp9LG9Vk3cZygsZ2K0M4v-zg1k-lqJ1mxIREB1uOBKz4Mh96KFz3seN1V3bgODfmlsrX1EurMa7xJn2QoPrWrtz5nsIdnuW3PFVMc57b1oJhZDucULL9d1TyGuvzJwMT5ZLWXb8_Itk-vnTVW4KmqMQvKItdYj5A86J-JaHKHq79hsbyDBJyvB',
    bars: [3, 2, 5, 3, 6, 2, 4, 3, 2],
  },
  {
    id: 'rec-4',
    name: 'Mr. Sunil Perera',
    location: 'Anuradhapura',
    duration: '10 mins',
    avatar: 'https://i.pravatar.cc/150?img=11',
    bars: [2, 3, 4, 5, 3, 2, 4, 5],
  }
];

const MODERATION_LIST = [
  {
    id: 'mod-1',
    title: 'Sigiriya Rock Gardens & Water Features',
    type: 'video',
    author: 'Priyantha C.',
    time: '5 mins ago',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCiU4M7TKJ8SywceJc_v2uBr9lBdAWZY3foF-U7xwE0PZp4HcVxcKCpeczRUmMto4DH3NGNGzQlqkuRIOc_qF6lPMafDffijQ58uGW1XBHKME2L_R__8NPzsVTfqj-MqX2bGLPMlOWwLV53rLBDDmubH3NFy7K_V0DJv-iXJ9pqix5z_0LWaYFlMoxB3SmqixdFm5UOnRJGJxqxk-kGxbHeUtEC39ZmUiuyegTgdIEI2D1HNdULgZzl',
    isNew: true,
    screen: 'video',
  },
  {
    id: 'mod-2',
    title: 'Traditional Weaving Techniques in Kandy',
    type: 'video',
    author: 'Mrs. Sunethra',
    time: '2h ago',
    image: 'https://images.unsplash.com/photo-1605369650085-f2d01ef8da78?q=80&w=600',
    screen: 'video',
  },
  {
    id: 'mod-3',
    title: 'The History of Ceylon Tea and its Origins',
    type: 'blog',
    author: 'Mr. Saman',
    time: '4h ago',
    image: 'https://images.unsplash.com/photo-1594910398686-2a7e43692d2b?q=80&w=600',
    screen: 'blog',
  },
  {
    id: 'mod-4',
    title: 'Mask Carving in Ambalangoda Masterclass',
    type: 'video',
    author: 'Karunaratne H.',
    time: '1d ago',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDux_unKhgQoX94K9rhlnGT6AR9X41j3lM480DfbajmgpYFUnVvN90Ziz1WGbxXBJQopvAhBzZOkdt6bKKZ_PO1JcljAZXKLoX_jsRQ6ggRqkOgR-g8GBl-XFEkZw4edBKLaTdWAevysxyB-UOeEy3ObWPmAVwZT5_S3DYDlPPzg2aGvGkO2sdxUibCsGn3DVo1JYxPF9Yzci50SdtOM00mfjtxo4XGIPD3G5NdHd0_8sZE70On0ge6',
    screen: 'video',
  },
  {
    id: 'mod-5',
    title: 'Ancient Irrigation Systems in Anuradhapura',
    type: 'blog',
    author: 'Sunil P.',
    time: '2d ago',
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=600',
    screen: 'blog',
  },
  {
    id: 'mod-6',
    title: 'Low Country Drumming Traditions',
    type: 'video',
    author: 'Kusuma W.',
    time: '3d ago',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600',
    screen: 'video',
  }
];

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'analytics', label: 'Analytics', icon: 'analytics' },
  { id: 'recordings', label: 'Recordings', icon: 'mic' },
  { id: 'moderation', label: 'Moderation', icon: 'gavel' }
];

// ─── Sub-components ──────────────────────────────────────────────────────────
const FadeInView = ({ children, delay = 0, style }: any) => {
  const anim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 600, delay, useNativeDriver: true }).start();
  }, [delay]);
  return <Animated.View style={[style, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }] }]}>{children}</Animated.View>;
};

const AnimatedBlob = ({ color = 'rgba(254, 137, 62, 0.15)' }) => {
  const anim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 3000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute', width: 120, height: 120, borderRadius: 60,
      backgroundColor: color, top: -30, right: -30,
      transform: [
        { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) },
        { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }
      ]
    }} pointerEvents="none" />
  );
};

const VoiceCard = ({ item, onNavigate }: { item: any, onNavigate?: (tab: string) => void }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(14);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && progress < 45) {
      interval = setInterval(() => {
        setProgress(p => Math.min(p + 1, 45));
      }, 500);
    } else if (progress >= 45) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, progress]);

  return (
    <View style={styles.voiceCard}>
      <View style={styles.voiceCardHeader}>
        <View style={styles.voiceAvatarRow}>
          <Image source={{ uri: item.avatar }} style={styles.voiceAvatar} />
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.voiceName}>{item.name}</Text>
              {item.isNew && (
                <View style={{ backgroundColor: 'rgba(254, 137, 62, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 8, fontWeight: '700', color: '#e8792e' }}>NEW</Text>
                </View>
              )}
            </View>
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={12} color={Colors.textMuted} />
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
          </View>
        </View>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{item.duration}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 }}>
        <TouchableOpacity 
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(15, 92, 92, 0.1)', alignItems: 'center', justifyContent: 'center' }}
          onPress={() => setIsPlaying(!isPlaying)}
        >
          <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={24} color={Colors.secondary} />
        </TouchableOpacity>
        
        <View style={styles.waveformContainer}>
          {Array.from({ length: 30 }).map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.waveBar, 
                { backgroundColor: 'rgba(15, 92, 92, 0.35)' },
                { height: `${Math.max(30, Math.floor(Math.random() * 70) + 30)}%` },
                i < (progress * (30/45)) && { backgroundColor: Colors.accent, opacity: 1 }
              ]} 
            />
          ))}
        </View>
      </View>
      <View style={styles.actionArea}>
        <TouchableOpacity
          style={styles.btnPrimary}
          activeOpacity={0.8}
          onPress={() => onNavigate?.('opp_review')}
        >
          <Text style={styles.btnPrimaryText}>Start Listening</Text>
          <MaterialIcons name="arrow-forward" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
interface AdminHomeScreenProps {
  onNavigate?: (tab: string) => void;
  intakeBadge?: string | null;
  reviewBadge?: string | null;
}

export const AdminHomeScreen: React.FC<AdminHomeScreenProps> = ({ onNavigate, intakeBadge, reviewBadge }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'analytics'>('overview');
  const { drafts, setActiveDraftId, setOriginTab } = useOpportunity();
  const user = useAuthStore(state => state.user);

  const [greetingPrefix, setGreetingPrefix] = useState('Good morning');
  const displayName = user?.fullName ? user.fullName.split(' ')[0] : 'Lakni';

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) {
      setGreetingPrefix('Good morning');
    } else if (hours < 17) {
      setGreetingPrefix('Good afternoon');
    } else {
      setGreetingPrefix('Good evening');
    }
  }, []);

  // Dynamic counts based on badge simulation
  const displayIntakeCount = intakeBadge ? parseInt(intakeBadge) : 18;
  const displayReviewCount = reviewBadge ? parseInt(reviewBadge) : 5;

  // Filter records dynamically based on simulated content arrival
  const filteredRecordings = RECORDINGS_LIST.filter(rec => !rec.isNew || intakeBadge === '19');
  // If the user hasn't triggered new items, show Mrs. Kamala, Mr. Saman, Mr. Sunil.
  // When '19' is active, Mrs. Sunethra is prepended to the top making it 4 items.
  // We slice to display exactly 3 recordings for the baseline, or 4 if newly added.
  const displayedRecordings = intakeBadge === '19' ? filteredRecordings.slice(0, 4) : filteredRecordings.slice(0, 3);

  const filteredModeration = MODERATION_LIST.filter(mod => !mod.isNew || reviewBadge === '6');
  const displayedModeration = reviewBadge === '6' ? filteredModeration.slice(0, 6) : filteredModeration.slice(0, 5);

  // Dynamic stats that update when new data is received
  const activeOppsCount = intakeBadge === '19' ? 43 : 42;
  const resolutionRate = reviewBadge === '6' ? '93.8%' : '94.2%';
  const engagedCreators = intakeBadge === '19' ? 90 : 89;
  const augSubmissionsVal = (intakeBadge === '19' || reviewBadge === '6') ? 73 : 72;
  const augSubmissionsHeight = (intakeBadge === '19' || reviewBadge === '6') ? 100 : 96;

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Section 1: Greeting ─────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.greetingTitle}>{greetingPrefix}, {displayName}</Text>
          <Text style={styles.greetingSubtitle}>What needs your attention today</Text>
        </View>

        {/* ── Section 2: Header Toggle ────────────────────────────────── */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, activeSection === 'overview' && styles.toggleButtonActive]}
              onPress={() => setActiveSection('overview')}
            >
              <Text style={[styles.toggleLabel, activeSection === 'overview' && styles.toggleLabelActive]}>Overview</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, activeSection === 'analytics' && styles.toggleButtonActive]}
              onPress={() => setActiveSection('analytics')}
            >
              <Text style={[styles.toggleLabel, activeSection === 'analytics' && styles.toggleLabelActive]}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Section Content: OVERVIEW ────────────────────────────────── */}
        {activeSection === 'overview' && (
          <FadeInView style={{ gap: Spacing.lg }}>
            {/* Attention Grid */}
            <View style={styles.attentionGrid}>
              <View style={{ flexDirection: 'row', gap: Spacing.md, width: '100%' }}>
                {/* Recordings Card */}
                <TouchableOpacity 
                  style={[styles.attentionCard, { backgroundColor: '#0f5c5c', overflow: 'hidden' }]} 
                  activeOpacity={0.8} 
                  onPress={() => onNavigate?.('intake')}
                >
                  <AnimatedBlob color="rgba(255,255,255,0.12)" />
                  <View style={[styles.attentionCircleTeal, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                    <Text style={styles.attentionCount}>{displayIntakeCount}</Text>
                  </View>
                  <Text style={[styles.attentionLabel, { color: Colors.white }]}>Recordings</Text>
                  <Text style={[styles.attentionSub, { color: 'rgba(255,255,255,0.7)' }]}>Ready for review</Text>
                </TouchableOpacity>

                {/* Moderation Card */}
                <TouchableOpacity 
                  style={[styles.attentionCard, { backgroundColor: '#e8792e', overflow: 'hidden' }]} 
                  activeOpacity={0.8} 
                  onPress={() => onNavigate?.('review')}
                >
                  <AnimatedBlob color="rgba(255,255,255,0.15)" />
                  <View style={[styles.attentionCircleTeal, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Text style={styles.attentionCount}>{displayReviewCount}</Text>
                  </View>
                  <Text style={[styles.attentionLabel, { color: Colors.white }]}>Moderation</Text>
                  <Text style={[styles.attentionSub, { color: 'rgba(255,255,255,0.8)' }]}>Reported items</Text>
                </TouchableOpacity>
              </View>

              {/* Opportunities – Full Width */}
              <TouchableOpacity 
                style={[styles.attentionCardFull, { backgroundColor: '#fff3e0' }]} 
                activeOpacity={0.8} 
                onPress={() => { 
                  setOriginTab('admin_home'); 
                  onNavigate?.('drafts'); 
                }}
              >
                <View style={styles.attentionFullLeft}>
                  <View style={[styles.publishIconCircle, { backgroundColor: '#ffe0b2' }]}>
                    <MaterialIcons name="edit" size={20} color="#e8792e" />
                  </View>
                  <View>
                    <Text style={styles.attentionLabel}>{drafts.length} Drafts</Text>
                    <Text style={styles.attentionSub}>Complete and publish drafts</Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Start Listening Audios (Recordings Queue Section) */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Start Listening Audios ({displayedRecordings.length})</Text>
                <TouchableOpacity onPress={() => onNavigate?.('intake')}>
                  <Text style={styles.viewAllText}>View all</Text>
                </TouchableOpacity>
              </View>
              {displayedRecordings.map((v) => (
                <VoiceCard key={v.id} item={v} onNavigate={onNavigate} />
              ))}
            </View>

            {/* Opportunities Creation Banner */}
            <View style={styles.oppsBanner}>
              <View style={styles.oppsBannerHeader}>
                <View style={styles.oppsIconBox}>
                  <MaterialIcons name="campaign" size={22} color="#672c00" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.oppsBannerTitle}>Opportunities Ready</Text>
                  <Text style={styles.oppsBannerBody}>
                    You have approved recordings that need to be turned into learning opportunities.
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.createOppsBtn} activeOpacity={0.85} onPress={() => { setActiveDraftId(null); setOriginTab('admin_home'); onNavigate?.('add_opp'); }}>
                <MaterialIcons name="add-circle" size={18} color={Colors.white} />
                <Text style={styles.createOppsBtnText}>Create Opportunity</Text>
              </TouchableOpacity>
            </View>

            {/* Moderation Queue Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Moderation Queue ({displayedModeration.length})</Text>
                <TouchableOpacity onPress={() => onNavigate?.('review')}>
                  <Text style={styles.viewAllText}>View all</Text>
                </TouchableOpacity>
              </View>

              {displayedModeration.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.contentCard} 
                  activeOpacity={0.8} 
                  onPress={() => onNavigate?.(item.screen as any)}
                >
                  <Image source={{ uri: item.image }} style={styles.contentImage} />
                  <View style={styles.contentInfo}>
                    <View style={[
                      styles.contentTag, 
                      item.type === 'blog' && { backgroundColor: 'rgba(254,137,62,0.1)' }
                    ]}>
                      <Text style={[
                        styles.contentTagText,
                        item.type === 'blog' && { color: '#e8792e' }
                      ]}>
                        {item.type}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={styles.contentTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      {item.isNew && (
                        <View style={{ backgroundColor: 'rgba(232, 121, 46, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' }}>
                          <Text style={{ fontFamily: Typography.fontBodyMed, fontSize: 8, fontWeight: '700', color: '#e8792e' }}>NEW REPORT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.contentMeta}>By {item.author} • {item.time}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </FadeInView>
        )}

        {/* ── Section Content: ANALYTICS ────────────────────────────────── */}
        {activeSection === 'analytics' && (
          <FadeInView style={{ gap: Spacing.lg }}>
            {/* Stat Cards Grid */}
            <View style={styles.statsGrid}>
              {/* Stat 1 */}
              <View style={styles.statCard}>
                <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(15,92,92,0.1)' }]}>
                  <MaterialIcons name="campaign" size={20} color={Colors.secondary} />
                </View>
                <Text style={styles.statVal}>{activeOppsCount}</Text>
                <Text style={styles.statTitle}>Active Opps</Text>
                <Text style={[styles.statTrend, { color: '#10b981' }]}>+12% vs last wk</Text>
              </View>
              {/* Stat 2 */}
              <View style={styles.statCard}>
                <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(232,121,46,0.1)' }]}>
                  <MaterialIcons name="gavel" size={20} color="#e8792e" />
                </View>
                <Text style={styles.statVal}>{displayReviewCount}</Text>
                <Text style={styles.statTitle}>Pending Reviews</Text>
                <Text style={[styles.statTrend, { color: '#ba1a1a' }]}>3 reported today</Text>
              </View>
              {/* Stat 3 */}
              <View style={styles.statCard}>
                <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                  <MaterialIcons name="speed" size={20} color="#10b981" />
                </View>
                <Text style={styles.statVal}>{resolutionRate}</Text>
                <Text style={styles.statTitle}>Resolution Rate</Text>
                <Text style={[styles.statTrend, { color: '#10b981' }]}>Avg: 4.5 hrs</Text>
              </View>
              {/* Stat 4 */}
              <View style={styles.statCard}>
                <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(2,132,201,0.1)' }]}>
                  <MaterialIcons name="groups" size={20} color="#0284c9" />
                </View>
                <Text style={styles.statVal}>{engagedCreators}</Text>
                <Text style={styles.statTitle}>Engaged Creators</Text>
                <Text style={[styles.statTrend, { color: '#0284c9' }]}>55 Youth, 34 Elder</Text>
              </View>
            </View>

            {/* Category Distribution Stacked Bar Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Opportunity Categories</Text>
              <Text style={styles.chartSubtitle}>Distribution of learning topics across regions</Text>
              
              <View style={styles.stackedBarContainer}>
                <View style={[styles.stackedBarSegment, { width: '40%', backgroundColor: Colors.secondary }]} />
                <View style={[styles.stackedBarSegment, { width: '30%', backgroundColor: Colors.accent }]} />
                <View style={[styles.stackedBarSegment, { width: '20%', backgroundColor: '#eab308' }]} />
                <View style={[styles.stackedBarSegment, { width: '10%', backgroundColor: '#0284c9' }]} />
              </View>

              <View style={styles.legendGrid}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.secondary }]} />
                  <Text style={styles.legendText}>Crafts <Text style={styles.legendPercentage}>40%</Text></Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
                  <Text style={styles.legendText}>Food <Text style={styles.legendPercentage}>30%</Text></Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#eab308' }]} />
                  <Text style={styles.legendText}>Tradition <Text style={styles.legendPercentage}>20%</Text></Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#0284c9' }]} />
                  <Text style={styles.legendText}>Music <Text style={styles.legendPercentage}>10%</Text></Text>
                </View>
              </View>
            </View>

            {/* Custom Bar Graph */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Monthly Submissions</Text>
              <Text style={styles.chartSubtitle}>Trend of incoming content waiting for reviews</Text>
              
              <View style={styles.barChartContainer}>
                {[
                  { month: 'Mar', val: 28, height: 40 },
                  { month: 'Apr', val: 35, height: 50 },
                  { month: 'May', val: 48, height: 68 },
                  { month: 'Jun', val: 52, height: 75 },
                  { month: 'Jul', val: 60, height: 85 },
                  { month: 'Aug', val: augSubmissionsVal, height: augSubmissionsHeight }
                ].map((item, idx) => (
                  <View key={idx} style={styles.barCol}>
                    <Text style={styles.barVal}>{item.val}</Text>
                    <View style={styles.barWrapper}>
                      <View style={[styles.barFill, { height: `${item.height}%` }]} />
                    </View>
                    <Text style={styles.barLabel}>{item.month}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Circular Gauge Card */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Moderation Decisions</Text>
              <Text style={styles.chartSubtitle}>Status breakdown of processed reports</Text>
              
              <View style={styles.gaugeWrapper}>
                <View style={styles.gaugeCircle}>
                  <View>
                    <Text style={styles.gaugeCenterText}>92.4%</Text>
                    <Text style={styles.gaugeCenterSub}>Approved</Text>
                  </View>
                </View>
                
                <View style={styles.gaugeStats}>
                  <View style={styles.gaugeStatItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.secondary }]} />
                    <Text style={styles.legendText}>Approved & Live (85%)</Text>
                  </View>
                  <View style={styles.gaugeStatItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
                    <Text style={styles.legendText}>Archived / Fixed (7.4%)</Text>
                  </View>
                  <View style={styles.gaugeStatItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#ba1a1a' }]} />
                    <Text style={styles.legendText}>Rejected / Flagged (7.6%)</Text>
                  </View>
                </View>
              </View>
            </View>
          </FadeInView>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </View>
  );
};

export default AdminHomeScreen;
