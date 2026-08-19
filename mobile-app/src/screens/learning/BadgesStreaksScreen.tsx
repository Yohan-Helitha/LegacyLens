// src/screens/learning/BadgesStreaksScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { mockBadges, mockProgress } from '../../constants/mockLearningData';
import { Badge } from '../../types/learning';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function BadgesStreaksScreen() {
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
      <Text style={styles.header}>Badges & Streaks</Text>

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
  container: { flex: 1, backgroundColor: '#FDF6EC', paddingTop: 50, paddingHorizontal: 16 },
  header: { fontSize: 22, fontWeight: '700', color: '#3E2723', marginBottom: 16 },
  streakCard: { backgroundColor: '#F4E1C6', borderRadius: 16, padding: 16, marginBottom: 20 },
  streakHeadline: { fontSize: 18, fontWeight: '800', color: '#8D6E38', marginBottom: 12 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  dayColumn: { alignItems: 'center' },
  dayDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#E8D5BC', marginBottom: 4 },
  dayDotDone: { backgroundColor: '#C9782E' },
  dayLabel: { fontSize: 10, color: '#8D6E38' },
  motivationText: { fontSize: 12, color: '#8D6E38', fontStyle: 'italic' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#3E2723', marginBottom: 10 },
  badgeGrid: { paddingBottom: 20 },
  badgeRow: { justifyContent: 'space-between', marginBottom: 12 },
  badgeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    width: '31%',
  },
  badgeCardLocked: { backgroundColor: '#F2ECE3' },
  badgeIcon: { fontSize: 28, marginBottom: 6 },
  badgeIconLocked: { opacity: 0.4 },
  badgeName: { fontSize: 11, fontWeight: '700', color: '#3E2723', textAlign: 'center' },
  badgeNameLocked: { color: '#9B8D7D' },
  unlockHint: { fontSize: 9, color: '#9B8D7D', textAlign: 'center', marginTop: 4 },
});