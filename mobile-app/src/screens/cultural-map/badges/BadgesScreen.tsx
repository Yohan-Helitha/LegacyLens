import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Modal,
  Animated,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Colors, Typography, Spacing, Radii } from '../../../theme';
import { Header } from '../../../components/common/Header';

// ─────────────────────────────────────────────────────────────────────────────
// Data Types
// ─────────────────────────────────────────────────────────────────────────────
export interface BadgeItem {
  id: string;
  title: string;
  category: string;
  textureType: 'wood' | 'brass' | 'clay' | 'locked' | 'rare';
  imageSource: any;
  earnedDate?: string;
  howEarned?: string;
  culturalContext?: string;
  isUnlocked: boolean;
  isFullWidth?: boolean;
}

export interface TimelineItem {
  id: string;
  date: string;
  title: string;
  description: string;
  imageSource: any;
  textureType: 'clay' | 'start';
}

const EARNED_BADGES: BadgeItem[] = [
  {
    id: 'kandyan-rhythm',
    title: 'Kandyan Rhythm Keeper',
    category: 'Traditional Dance',
    textureType: 'wood',
    imageSource: require('../../../../assets/badges/1.png'),
    earnedDate: 'Dec 12, 2023',
    howEarned:
      'Successfully identified and played the traditional Gata Bera rhythms in the Kandy cultural challenge.',
    culturalContext:
      'The Gata Bera is a traditional Sri Lankan drum essential to Kandyan dance. Carved from native woods, its distinct sounds dictate the rhythm of sacred rituals.',
    isUnlocked: true,
  },
  {
    id: 'sigiriya-explorer',
    title: 'Sigiriya Explorer',
    category: 'Ancient Architecture',
    textureType: 'clay',
    imageSource: require('../../../../assets/badges/2.png'),
    earnedDate: 'May 28, 2024',
    howEarned:
      'Explored the ancient Sigiriya Citadel and decrypted the celestial water garden watercraft riddles.',
    culturalContext:
      'Sigiriya is an 5th-century ancient palace fortress famous for its frescoes, mirror wall, and advanced hydraulic engineering.',
    isUnlocked: true,
  },
  {
    id: 'ceylon-tea',
    title: 'Ceylon Tea Master',
    category: 'Hill Country Heritage',
    textureType: 'brass',
    imageSource: require('../../../../assets/badges/3.png'),
    earnedDate: 'Aug 10, 2024',
    howEarned:
      'Navigated the lush tea estates of Nuwara Eliya and mastered the delicate art of tea leaf plucking.',
    culturalContext:
      'Ceylon Tea is world-renowned for its crisp aroma and rich flavor, introduced during the colonial era and grown in Sri Lanka\'s central highlands.',
    isUnlocked: true,
    isFullWidth: true,
  },
];

const LOCKED_BADGES: BadgeItem[] = [
  {
    id: 'galle-fort',
    title: 'Galle Fort Navigator',
    category: 'Coastal History',
    textureType: 'locked',
    imageSource: require('../../../../assets/badges/4.png'),
    isUnlocked: false,
  },
  {
    id: 'temple-tooth',
    title: 'Temple of the Tooth Pilgrim',
    category: 'Sacred Relic',
    textureType: 'locked',
    imageSource: require('../../../../assets/badges/5.png'),
    isUnlocked: false,
  },
  {
    id: 'vesak-lantern',
    title: 'Vesak Illuminator',
    category: 'Festival of Lights',
    textureType: 'locked',
    imageSource: require('../../../../assets/badges/6.png'),
    isUnlocked: false,
  },
  {
    id: 'stilt-fisher',
    title: 'Stilt Fisher\'s Balance',
    category: 'Coastal Tradition',
    textureType: 'locked',
    imageSource: require('../../../../assets/badges/7.png'),
    isUnlocked: false,
  },
  {
    id: 'yala-tracker',
    title: 'Yala Wildlife Tracker',
    category: 'Nature Reserve',
    textureType: 'locked',
    imageSource: require('../../../../assets/badges/8.png'),
    isUnlocked: false,
  },
  {
    id: 'ruwanwelisaya',
    title: 'Ruwanwelisaya Devotee',
    category: 'Ancient Stupa',
    textureType: 'locked',
    imageSource: require('../../../../assets/badges/9.png'),
    isUnlocked: false,
  },
  {
    id: 'mask-artisan',
    title: 'Devil Mask Artisan',
    category: 'Ambalangoda Crafts',
    textureType: 'locked',
    imageSource: require('../../../../assets/badges/10.png'),
    isUnlocked: false,
  },
  {
    id: 'nine-arch',
    title: 'Nine Arch Wanderer',
    category: 'Railway Heritage',
    textureType: 'rare',
    imageSource: require('../../../../assets/badges/11.png'),
    isUnlocked: false,
    isFullWidth: true,
  },
];

const TIMELINE_ITEMS: TimelineItem[] = [
  {
    id: 'tl-1',
    date: 'Aug 2024',
    title: 'Ceylon Tea Master Earned',
    description: 'Mastered the delicate art of tea leaf plucking.',
    imageSource: require('../../../../assets/badges/3.png'),
    textureType: 'clay',
  },
  {
    id: 'tl-2',
    date: 'May 2024',
    title: 'Sigiriya Explorer Earned',
    description: 'Completed Sigiriya Rock Fortress hunt.',
    imageSource: require('../../../../assets/badges/2.png'),
    textureType: 'clay',
  },
  {
    id: 'tl-3',
    date: 'Dec 2023',
    title: 'Kandyan Rhythm Keeper Earned',
    description: 'Played the traditional Gata Bera rhythms.',
    imageSource: require('../../../../assets/badges/1.png'),
    textureType: 'start',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component Definition
// ─────────────────────────────────────────────────────────────────────────────
interface BadgesProps {
  onNavigate?: (tab: string) => void;
}

import { useTreasureHunt } from '../../../context/TreasureHuntContext';

export const BadgesScreen: React.FC<BadgesProps> = ({ onNavigate }) => {
  const { unlockedBadges } = useTreasureHunt();
  const ALL_BADGES = [...EARNED_BADGES, ...LOCKED_BADGES];
  
  const earnedBadges = unlockedBadges
    .map(id => ALL_BADGES.find(b => b.id === id))
    .filter((b): b is BadgeItem => b !== undefined)
    .map(b => ({
      ...b,
      isUnlocked: true,
      textureType: b.textureType === 'locked' ? 'wood' : b.textureType,
    }));

  const timelineItems = [...earnedBadges].reverse().map((badge, index, arr) => ({
    id: `tl-${badge.id}`,
    date: `Unlock #${arr.length - index}`,
    title: `${badge.title} Earned`,
    description: badge.howEarned || `Completed the ${badge.title} hunt.`,
    imageSource: badge.imageSource,
    textureType: (index === arr.length - 1) ? 'start' as const : 'clay' as const,
  }));
  
  const lockedBadges = ALL_BADGES.filter(b => !unlockedBadges.includes(b.id)).map(b => ({
    ...b,
    isUnlocked: false,
    textureType: b.textureType === 'rare' ? 'rare' : 'locked',
  }));

  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);
  const modalSlideAnim = useRef(new Animated.Value(300)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

  React.useEffect(() => {
    const playMusic = async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          require('../../../../assets/sounds/inside-map/badges-music.mp3'),
          { shouldPlay: true, isLooping: true, volume: 1.0 }
        );
        soundRef.current = sound;
      } catch (error) {
        console.warn('Error playing badges music', error);
      }
    };

    playMusic();

    return () => {
      if (soundRef.current) {
        soundRef.current.stopAsync();
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const openBadgeModal = (badge: BadgeItem) => {
    if (!badge.isUnlocked) return;
    setSelectedBadge(badge);
    Animated.spring(modalSlideAnim, {
      toValue: 0,
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }).start();
  };

  const closeBadgeModal = () => {
    Animated.timing(modalSlideAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelectedBadge(null));
  };

  return (
    <ImageBackground 
      source={require('../../../../assets/map/badges-bg.png')} 
      style={styles.safeArea}
      imageStyle={{ opacity: 0.1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0f5c5c" />

      {/* ── Floating Back Button ─────────────────────────────────────────────── */}
      <TouchableOpacity 
        style={styles.floatingBackBtn} 
        activeOpacity={0.8}
        onPress={() => onNavigate && onNavigate('map')}
      >
        <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Hero Section ──────────────────────────────────────────── */}
        <View style={styles.heroHeader}>
          <Text style={styles.heroTitle}>TREASURE HUNT BADGES</Text>
          <Text style={styles.heroSubtitle}>
            Your cultural discoveries from across Sri Lanka
          </Text>

          {/* Progress Box over Map Silhouette */}
          <View style={styles.mapSilhouetteBox}>
            <ImageBackground
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAhoWD-NuavYf3Y3_1Zsx4qfrikaxsXSRsBDTwBkLXb4Uh6q_tmNUEnWF70f0NyX-MrOEAwbfmFZu0V7JjBkW2IrX3jVXtYv3fhriA94wLx2cdtGkghq8m2mUKLHFsO4GEI9OHBipejDSCL8cgn231wGkOWS4pBBrjwB_OQ6Gar-hFGfbWplgmrU-VLkwypVQZCSLSQFvvRMrNj_nWhoR24m0ROkPm3-DJ03HqVXhq234gtGvyxFj9',
              }}
              style={styles.silhouetteImage}
              resizeMode="contain"
              imageStyle={{ opacity: 0.2 }}
            >
              <View style={styles.progressOverlayContent}>
                <View style={styles.progressRankRow}>
                  <Text style={styles.rankText}>Beginner</Text>
                  <Text style={styles.rankText}>Master</Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: '33%' }]} />
                </View>

                <Text style={styles.progressCounterText}>{earnedBadges.length} / {ALL_BADGES.length} Badges Collected</Text>
              </View>
            </ImageBackground>
          </View>
        </View>

        {/* ── 2. Next Badge Insight Banner ─────────────────────────────── */}
        <View style={styles.insightSection}>
          <TouchableOpacity 
            style={styles.insightBox}
            activeOpacity={0.85}
            onPress={() => onNavigate && onNavigate('hunt')}
          >
            <View style={styles.insightCompassCircle}>
              <MaterialIcons name="explore" size={24} color={Colors.accent} />
            </View>

            <View style={styles.insightTextCol}>
              <Text style={styles.insightTag}>Next Unlock</Text>
              <Text style={styles.insightTitle}>
                You are close to unlocking Galle Fort Navigator (4/5)
              </Text>
            </View>

            <View style={styles.insightChevronBtn}>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={Colors.accent}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── 3. Earned Badges Museum Case ─────────────────────────────── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons
              name="workspace-premium"
              size={22}
              color={Colors.secondary}
            />
            <Text style={styles.sectionTitle}>EARNED BADGES</Text>
          </View>

          <View style={styles.museumCaseGrid}>
            {earnedBadges.map(badge => (
              <TouchableOpacity
                key={badge.id}
                style={styles.earnedBadgeCard}
                onPress={() => openBadgeModal(badge)}
                activeOpacity={0.85}
              >
                <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm }}>
                  <Image 
                    source={badge.imageSource} 
                    style={{ width: 100, height: 100, resizeMode: 'contain' }} 
                  />
                </View>

                <Text style={styles.badgeTitle}>{badge.title}</Text>
                <Text style={styles.badgeCategory}>{badge.category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── 4. Treasure Journey Timeline ─────────────────────────────── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="timeline" size={22} color={Colors.secondary} />
            <Text style={styles.sectionTitle}>Treasure Journey</Text>
          </View>

          <View style={styles.timelineList}>
            {/* Continuous Vertical Line */}
            <View style={styles.timelineVerticalLine} />

            {timelineItems.map((item) => (
              <View key={item.id} style={styles.timelineItemRow}>
                {/* Node Bullet */}
                <View
                  style={[
                    styles.timelineDot,
                    item.textureType === 'clay'
                      ? styles.timelineDotActive
                      : styles.timelineDotMuted,
                  ]}
                />

                <View style={styles.timelineContentBox}>
                  <Text
                    style={[
                      styles.timelineDateText,
                      item.textureType === 'clay' && styles.timelineDateActive,
                    ]}
                  >
                    {item.date}
                  </Text>

                  <View style={styles.timelineCard}>
                    <View
                      style={[
                        styles.timelineIconBadge,
                      ]}
                    >
                      <Image 
                        source={item.imageSource}
                        style={{ 
                          width: 44, 
                          height: 44, 
                          resizeMode: 'contain', 
                          opacity: item.textureType === 'start' ? 0.6 : 1.0 
                        }}
                      />
                    </View>

                    <View style={styles.timelineCardTextCol}>
                      <Text style={styles.timelineCardTitle}>{item.title}</Text>
                      <Text style={styles.timelineCardDesc}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── 5. Badges To Discover (Locked) ───────────────────────────── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="lock" size={20} color={Colors.secondary} />
            <Text style={styles.sectionTitle}>BADGES TO DISCOVER</Text>
          </View>

          <View style={styles.museumCaseGrid}>
            {lockedBadges.map(badge => (
              <View
                key={badge.id}
                style={[
                  styles.lockedBadgeCard,
                  badge.textureType === 'rare' && styles.lockedBadgeRareBorder,
                ]}
              >
                <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs }}>
                  <Image 
                    source={badge.imageSource} 
                    style={{ 
                      width: 80, 
                      height: 80, 
                      resizeMode: 'contain',
                      opacity: badge.textureType === 'rare' ? 1.0 : 0.4 
                    }} 
                  />
                </View>

                <View style={styles.lockedTitleRow}>
                  <Text style={styles.lockedBadgeTitle}>{badge.title}</Text>
                  {badge.textureType === 'rare' && (
                    <MaterialIcons
                      name="auto-awesome"
                      size={14}
                      color="#D4AF37"
                    />
                  )}
                </View>

                <Text style={styles.lockedBadgeCategory}>{badge.category}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ── 6. Detail View Modal (Exhibit Details) ───────────────────── */}
      <Modal
        visible={selectedBadge !== null}
        transparent
        animationType="none"
        onRequestClose={closeBadgeModal}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={closeBadgeModal}
        >
          <Animated.View
            style={[
              styles.modalSheet,
              { transform: [{ translateY: modalSlideAnim }] },
            ]}
          >
            <View style={styles.modalDragHandle} />

            {selectedBadge && (
              <>
                <View style={styles.modalHeaderCol}>
                  <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md }}>
                    <Image 
                      source={selectedBadge.imageSource} 
                      style={{ width: 200, height: 200, resizeMode: 'contain' }} 
                    />
                  </View>

                  <Text style={styles.modalTitle}>{selectedBadge.title}</Text>
                  <Text style={styles.modalEarnedDate}>
                    Earned {selectedBadge.earnedDate}
                  </Text>
                </View>

                <View style={styles.modalDetailsList}>
                  <View style={styles.modalDetailBlock}>
                    <Text style={styles.modalDetailHeading}>
                      How You Earned This
                    </Text>
                    <View style={styles.modalDetailBox}>
                      <Text style={styles.modalDetailBody}>
                        {selectedBadge.howEarned}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalDetailBlock}>
                    <Text style={styles.modalDetailHeading}>
                      Cultural Context
                    </Text>
                    <View style={styles.modalDetailBox}>
                      <Text style={styles.modalDetailBody}>
                        {selectedBadge.culturalContext}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={closeBadgeModal}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalCloseBtnText}>Close Exhibit</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </ImageBackground>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.dominant,
  },
  scrollContent: {
    paddingBottom: Spacing.xl * 2,
  },

  // ── Floating Back Button ───────────────────────────────────────────────────
  floatingBackBtn: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    zIndex: 100,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  // ── 1. Hero Section ────────────────────────────────────────────────────────
  heroHeader: {
    backgroundColor: 'transparent',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  heroTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size2XL,
    fontWeight: '700',
    color: Colors.secondary,
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  mapSilhouetteBox: {
    width: '100%',
    height: 120,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    justifyContent: 'center',
  },
  silhouetteImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  progressOverlayContent: {
    paddingHorizontal: Spacing.md,
  },
  progressRankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rankText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeXS,
    fontWeight: '600',
    color: Colors.secondary,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E1E3E2',
    borderRadius: Radii.full,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: Radii.full,
  },
  progressCounterText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeXS,
    fontWeight: '600',
    color: Colors.secondary,
    textAlign: 'center',
  },

  // ── 2. Insight Section ─────────────────────────────────────────────────────
  insightSection: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  insightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: Radii.xl,
    padding: Spacing.sm,
    gap: 12,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  insightCompassCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTextCol: {
    flex: 1,
  },
  insightTag: {
    fontFamily: Typography.fontBodyMed,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightTitle: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeXS,
    fontWeight: '600',
    color: Colors.white,
    lineHeight: 18,
  },
  insightChevronBtn: {
    padding: 4,
  },

  // ── 3. Museum Case Section ─────────────────────────────────────────────────
  sectionContainer: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeMD,
    fontWeight: '700',
    color: Colors.secondary,
    letterSpacing: 0.5,
  },
  museumCaseGrid: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E1E3E2',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  earnedBadgeCard: {
    width: '48%',
    alignItems: 'center',
    gap: 4,
  },

  badgeTitle: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    fontWeight: '600',
    color: Colors.secondary,
    textAlign: 'center',
  },
  badgeCategory: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // ── 4. Timeline Section ────────────────────────────────────────────────────
  timelineList: {
    position: 'relative',
    paddingLeft: 24,
    gap: 16,
  },
  timelineVerticalLine: {
    position: 'absolute',
    left: 7,
    top: 6,
    bottom: 6,
    width: 2,
    backgroundColor: 'rgba(15, 92, 92, 0.2)',
  },
  timelineItemRow: {
    position: 'relative',
  },
  timelineDot: {
    position: 'absolute',
    left: -24,
    top: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  timelineDotActive: {
    backgroundColor: Colors.accent,
  },
  timelineDotMuted: {
    backgroundColor: '#BFC8C8',
  },
  timelineContentBox: {
    gap: 4,
  },
  timelineDateText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeXS,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  timelineDateActive: {
    color: Colors.accent,
  },
  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.sm,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E1E3E2',
  },
  timelineIconBadge: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineCardTextCol: {
    flex: 1,
  },
  timelineCardTitle: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    fontWeight: '600',
    color: Colors.secondary,
  },
  timelineCardDesc: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
  },

  // ── 5. Locked Badges Grid ──────────────────────────────────────────────────
  lockedBadgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  lockedBadgeCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E3E2',
    opacity: 0.7,
    gap: 4,
  },
  lockedBadgeRareBorder: {
    borderColor: '#D4AF37',
    opacity: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  lockedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockedBadgeTitle: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  lockedBadgeCategory: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // ── 6. Modal Styles ────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radii.xl * 1.2,
    borderTopRightRadius: Radii.xl * 1.2,
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    elevation: 10,
  },
  modalDragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E1E3E2',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalHeaderCol: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    fontWeight: '700',
    color: Colors.secondary,
  },
  modalEarnedDate: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeXS,
    color: Colors.accent,
    marginTop: 2,
  },
  modalDetailsList: {
    gap: 12,
    marginBottom: Spacing.lg,
  },
  modalDetailBlock: {
    gap: 4,
  },
  modalDetailHeading: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeXS,
    fontWeight: '600',
    color: Colors.text,
  },
  modalDetailBox: {
    backgroundColor: '#F8FAF9',
    padding: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#E1E3E2',
  },
  modalDetailBody: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  modalCloseBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: Radii.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    fontWeight: '700',
    color: Colors.white,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});

export default BadgesScreen;
