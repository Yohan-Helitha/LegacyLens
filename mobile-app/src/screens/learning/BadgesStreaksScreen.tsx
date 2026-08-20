// src/screens/learning/BadgesStreaksScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { mockBadges, mockProgress } from '../../constants/mockLearningData';
import { Badge } from '../../types/learning';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { useNavigation } from '@react-navigation/native';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function BadgesStreaksScreen() {
  const navigation = useNavigation();
  const { currentStreakDays, last7Days } = mockProgress;

  const renderBadge = ({ item }: { item: Badge }) => (
    <View style={[styles.badgeCard, !item.earned && styles.badgeCardLocked]}>
      <Text style={[styles.badgeIcon, !item.earned && styles.badgeIconLocked]}>
        {item.earned ? '🏅' : '🔒'}
      </Text>
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
        <Text style={styles.streakHeadline}>🔥 {currentStreakDays} Days</Text>
        <View style={styles.weekRow}>
          {last7Days.map((done, i) => (
            <View key={i} style={styles.dayColumn}>
              <View style={[styles.dayDot, done && styles.dayDotDone]} />
              <Text style={styles.dayLabel}>{DAY_LABELS[i]}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.motivationText}>Keep it up! Don't break your streak.</Text>
      </View>

      <Text style={styles.sectionTitle}>My Badges</Text>
      <FlatList
        data={mockBadges}
        keyExtractor={(item) => item.id}
        renderItem={renderBadge}
        numColumns={3}
        columnWrapperStyle={styles.badgeRow}
        contentContainerStyle={styles.badgeGrid}
      />
    </View>
  );
}

const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: Colors.dominant, paddingTop: 50, paddingHorizontal: Spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.sm },
  backArrow: { fontSize: Typography.sizeLG, color: Colors.text },
  header: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeXL - 2, color: Colors.text, marginBottom: Spacing.md },
  streakCard: { backgroundColor: Colors.secondarySubtle, borderRadius: Radii.xl, padding: Spacing.md, marginBottom: Spacing.lg - 4 },
  streakHeadline: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG, color: Colors.secondary, marginBottom: Spacing.sm + 2 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  dayColumn: { alignItems: 'center' },
  dayDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.surface, marginBottom: Spacing.xs },
  dayDotDone: { backgroundColor: Colors.accent },
  dayLabel: { fontFamily: Typography.fontBody, fontSize: 10, color: Colors.secondary },
  motivationText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: Colors.secondary, fontStyle: 'italic' },
  sectionTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: Colors.text, marginBottom: Spacing.sm + 2 },
  badgeGrid: { paddingBottom: Spacing.md },
  badgeRow: { justifyContent: 'space-between', marginBottom: Spacing.sm + 2 },
  badgeCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.sm + 2, alignItems: 'center', width: '31%' },
  badgeCardLocked: { backgroundColor: Colors.surface },
  badgeIcon: { fontSize: 28, marginBottom: Spacing.xs + 2 },
  badgeIconLocked: { opacity: 0.4 },
  badgeName: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS - 1, color: Colors.text, textAlign: 'center' },
  badgeNameLocked: { color: Colors.textMuted },
  unlockHint: { fontFamily: Typography.fontBody, fontSize: 9, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xs },
});