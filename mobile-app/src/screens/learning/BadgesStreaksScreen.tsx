// src/screens/learning/BadgesStreaksScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle, Path } from 'react-native-svg';
import { Badge } from '../../types/learning';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { apiGet } from '../../services/api/client';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type StreakData = {
  currentStreakDays: number;
  last7Days: boolean[];
};

/** Small gradient medal used on earned badge cards. */
function BadgeMedal({ earned }: { earned: boolean }) {
  if (!earned) {
    return (
      <View style={styles.lockCircle}>
        <Text style={styles.lockGlyph}>🔒</Text>
      </View>
    );
  }
  return (
    <Svg width={44} height={44} viewBox="0 0 44 44">
      <Defs>
        <LinearGradient id="badgeGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={Colors.accent} />
          <Stop offset="1" stopColor={Colors.secondary} />
        </LinearGradient>
      </Defs>
      <Circle cx="22" cy="22" r="21" fill="url(#badgeGrad)" />
      <Circle cx="22" cy="22" r="16" fill="none" stroke={Colors.white} strokeWidth={1.5} opacity={0.8} />
      <Path
        d="M22 13 L24.7 19.6 L32 20.2 L26.4 24.9 L28.2 32 L22 28 L15.8 32 L17.6 24.9 L12 20.2 L19.3 19.6 Z"
        fill={Colors.white}
      />
    </Svg>
  );
}

export default function BadgesStreaksScreen() {
  const navigation = useNavigation();

  const [badges, setBadges] = useState<Badge[]>([]);
  const [streak, setStreak] = useState<StreakData>({ currentStreakDays: 0, last7Days: [false, false, false, false, false, false, false] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [badgeData, streakData] = await Promise.all([
          apiGet<Badge[]>('/learning/badges/me'),
          apiGet<StreakData>('/learning/progress/me/streak'),
        ]);
        setBadges(badgeData);
        setStreak(streakData);
      } catch (error: any) {
        console.log('BADGES/STREAK ERROR:', error?.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const { currentStreakDays, last7Days } = streak;

  const renderBadge = ({ item }: { item: Badge }) => (
    <View style={[styles.badgeCard, item.earned && styles.badgeCardEarned]}>
      <BadgeMedal earned={item.earned} />
      <Text style={[styles.badgeName, !item.earned && styles.badgeNameLocked]} numberOfLines={2}>
        {item.name}
      </Text>
      {!item.earned && item.unlockHint ? (
        <Text style={styles.unlockHint} numberOfLines={2}>{item.unlockHint}</Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.header}>Badges & Streaks</Text>
      </View>

      <View style={styles.streakCard}>
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice">
          <Defs>
            <LinearGradient id="streakGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={Colors.secondary} />
              <Stop offset="1" stopColor={Colors.secondaryDark} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100" height="60" fill="url(#streakGrad)" />
          <Circle cx="92" cy="6" r="26" fill={Colors.accent} opacity={0.15} />
          <Circle cx="6" cy="56" r="18" fill={Colors.white} opacity={0.06} />
        </Svg>

        <Text style={styles.streakHeadline}>🔥 {currentStreakDays} Days</Text>
        <View style={styles.weekRow}>
          {last7Days.map((done, i) => (
            <View key={i} style={styles.dayColumn}>
              <View style={[styles.dayDot, done && styles.dayDotDone]}>
                {done ? <Text style={styles.dayDotCheck}>✓</Text> : null}
              </View>
              <Text style={styles.dayLabel}>{DAY_LABELS[i]}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.motivationText}>Keep it up! Don't break your streak.</Text>
      </View>

      <Text style={styles.sectionTitle}>My Badges</Text>
      {loading ? (
        <Text style={styles.motivationText}>Loading badges...</Text>
      ) : (
        <FlatList
          data={badges}
          keyExtractor={(item) => item.id}
          renderItem={renderBadge}
          numColumns={3}
          columnWrapperStyle={styles.badgeRow}
          contentContainerStyle={styles.badgeGrid}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dominant, paddingTop: 50, paddingHorizontal: Spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.sm },
  backArrow: { fontSize: Typography.sizeLG, color: Colors.text },
  header: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeXL - 2, color: Colors.text },

  streakCard: {
    overflow: 'hidden',
    borderRadius: Radii.xl,
    padding: Spacing.md,
    marginBottom: Spacing.lg - 4,
    shadowColor: Colors.secondaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  streakHeadline: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG, color: Colors.white, marginBottom: Spacing.sm + 2 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  dayColumn: { alignItems: 'center' },
  dayDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotDone: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 3,
  },
  dayDotCheck: { color: Colors.white, fontSize: 12, fontFamily: Typography.fontBodySemi },
  dayLabel: { fontFamily: Typography.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.85)' },
  motivationText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: Colors.white, fontStyle: 'italic', opacity: 0.9 },

  sectionTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: Colors.text, marginBottom: Spacing.sm + 2 },
  badgeGrid: { paddingBottom: Spacing.md },
  badgeRow: { justifyContent: 'space-between', marginBottom: Spacing.sm + 2 },
  badgeCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.sm + 2,
    alignItems: 'center',
    width: '31%',
    borderWidth: 1,
    borderColor: Colors.surface,
  },
  badgeCardEarned: {
    borderColor: Colors.accentSubtle,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  lockCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockGlyph: { fontSize: 18, opacity: 0.5 },
  badgeName: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS - 1, color: Colors.text, textAlign: 'center', marginTop: Spacing.xs + 2 },
  badgeNameLocked: { color: Colors.textMuted },
  unlockHint: { fontFamily: Typography.fontBody, fontSize: 9, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xs },
});