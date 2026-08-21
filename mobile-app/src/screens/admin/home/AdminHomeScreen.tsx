import React, { useState } from 'react';
import {
  Text, View, ScrollView, TouchableOpacity,
  Image, StatusBar, Alert, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii } from '../../../theme';
import { styles } from './AdminHomeScreen.styles';

// ─── Data ───────────────────────────────────────────────────────────────────
const VOICES = [
  {
    id: 'v1',
    name: 'Mrs. Kamala Wijesinghe',
    location: 'Matara',
    duration: '12 mins',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAH7-D0WjeNXK_Uvi1YZNypRZpKGGl9ARF1OKGCgjzzafTdzi8Ud7a87lLHmWiiVEq5vag2cvWWxwzmy3U9vqJrUCKglNcD31GjQoTz08zh1v8l_A0LQUFVwUPofpc3e2gWIjg-JTxerNyJTGxOUTfZzxS-ofTS1rkBaoNyoWQD_uP-wC8BSVLAfVekBtK4CMvHbz429JBR8A--jPYPo-JYjldjylfqD5YdNb57YR8okDiLlN7_u0PG',
    bars: [2, 4, 3, 5, 2, 6, 4, 2, 3, 5, 2],
  },
  {
    id: 'v2',
    name: 'Mr. Saman Perera',
    location: 'Kandy',
    duration: '8 mins',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkWtss9TvtEwCHV7GoEnjdFV5qyjJJ1Q4tWHFQcEdiWpHtWNKUTWyVbgiDPRYYo9Bp9LG9Vk3cZygsZ2K0M4v-zg1k-lqJ1mxIREB1uOBKz4Mh96KFz3seN1V3bgODfmlsrX1EurMa7xJn2QoPrWrtz5nsIdnuW3PFVMc57b1oJhZDucULL9d1TyGuvzJwMT5ZLWXb8_Itk-vnTVW4KmqMQvKItdYj5A86J-JaHKHq79hsbyDBJyvB',
    bars: [3, 2, 5, 3, 6, 2, 4, 3, 2],
  },
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

const VoiceCard = ({ item, onNavigate }: { item: typeof VOICES[0], onNavigate?: (tab: string) => void }) => {
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
            <Text style={styles.voiceName}>{item.name}</Text>
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
          <Text style={styles.btnPrimaryText}>Review</Text>
          <MaterialIcons name="arrow-forward" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
export const AdminHomeScreen: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'intake' | 'moderation' | 'opps'>('dashboard');

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Section 1: Greeting ─────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.greetingTitle}>Good morning, Lakni</Text>
          <Text style={styles.greetingSubtitle}>What needs your attention today</Text>
        </View>

        {/* ── Section 2: Attention Cards ──────────────────────────────── */}
        <View style={styles.attentionGrid}>
          <View style={{ flexDirection: 'row', gap: Spacing.md, width: '100%' }}>
            {/* Recordings */}
            <TouchableOpacity style={[styles.attentionCard, { backgroundColor: '#0f5c5c', overflow: 'hidden' }]} activeOpacity={0.8}>
              <AnimatedBlob />
              <View style={[styles.attentionCircleTeal, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Text style={styles.attentionCount}>18</Text>
              </View>
              <Text style={[styles.attentionLabel, { color: Colors.white }]}>Recordings</Text>
              <Text style={[styles.attentionSub, { color: 'rgba(255,255,255,0.7)' }]}>Ready for review</Text>
            </TouchableOpacity>

            {/* Moderation */}
            <TouchableOpacity style={[styles.attentionCard, { backgroundColor: '#e8792e', overflow: 'hidden' }]} activeOpacity={0.8}>
              <AnimatedBlob color="rgba(255,255,255,0.2)" />
              <View style={[styles.attentionCircleTeal, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={styles.attentionCount}>5</Text>
              </View>
              <Text style={[styles.attentionLabel, { color: Colors.white }]}>Moderation</Text>
              <Text style={[styles.attentionSub, { color: 'rgba(255,255,255,0.8)' }]}>Reported items</Text>
            </TouchableOpacity>
          </View>

          {/* Opportunities – Full Width */}
          <TouchableOpacity style={[styles.attentionCardFull, { backgroundColor: '#fff3e0' }]} activeOpacity={0.8} onPress={() => onNavigate?.('add_opp')}>
            <View style={styles.attentionFullLeft}>
              <View style={[styles.publishIconCircle, { backgroundColor: '#ffe0b2' }]}>
                <MaterialIcons name="publish" size={20} color="#e8792e" />
              </View>
              <View>
                <Text style={styles.attentionLabel}>3 Opportunities</Text>
                <Text style={styles.attentionSub}>Ready to publish</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── Section 3: Voices Waiting ────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Voices Waiting to be Heard</Text>
            <TouchableOpacity onPress={() => onNavigate?.('intake')}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>
          {VOICES.map((v) => <VoiceCard key={v.id} item={v} onNavigate={onNavigate} />)}
        </View>

        {/* ── Section 4: Opportunities Banner ─────────────────────────── */}
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
          <TouchableOpacity style={styles.createOppsBtn} activeOpacity={0.85} onPress={() => onNavigate?.('add_opp')}>
            <MaterialIcons name="add-circle" size={18} color={Colors.white} />
            <Text style={styles.createOppsBtnText}>Create Opportunity</Text>
          </TouchableOpacity>
        </View>

        {/* ── Section 5: Moderation Queue ──────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Moderation Queue</Text>
            <TouchableOpacity onPress={() => onNavigate?.('review')}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.contentCard} activeOpacity={0.8} onPress={() => onNavigate?.('video')}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1605369650085-f2d01ef8da78?q=80&w=600' }} style={styles.contentImage} />
            <View style={styles.contentInfo}>
              <View style={styles.contentTag}><Text style={styles.contentTagText}>Video</Text></View>
              <Text style={styles.contentTitle} numberOfLines={2}>Traditional Weaving Techniques in Kandy</Text>
              <Text style={styles.contentMeta}>By Mrs. Sunethra • 2h ago</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.contentCard} activeOpacity={0.8} onPress={() => onNavigate?.('blog')}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1594910398686-2a7e43692d2b?q=80&w=600' }} style={styles.contentImage} />
            <View style={styles.contentInfo}>
              <View style={[styles.contentTag, { backgroundColor: 'rgba(254,137,62,0.1)' }]}><Text style={[styles.contentTagText, { color: '#e8792e' }]}>Blog</Text></View>
              <Text style={styles.contentTitle} numberOfLines={2}>The History of Ceylon Tea and its Origins</Text>
              <Text style={styles.contentMeta}>By Mr. Saman • 4h ago</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>


    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────


export default AdminHomeScreen;
