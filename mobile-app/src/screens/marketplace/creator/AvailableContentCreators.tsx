import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Path } from 'react-native-svg';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';

/**
 * Elder-facing "browse content creators" page. There's no backend directory
 * endpoint for this yet — GET /api/users/me only returns the logged-in
 * user's own profile, and CreatorProfile (skills/interests/rating) is never
 * exposed as a public listing anywhere. This screen is built against
 * realistic placeholder data until that endpoint (something like
 * GET /api/creators with name/avatar/rating/skills/languages/availability)
 * exists on the backend.
 *
 * Design note: this page's audience is elderly knowledge holders, so every
 * text size here is deliberately larger than the youth-creator-side screens
 * elsewhere in the app (Typography.sizeMD/LG/XL as the floor, not
 * sizeXS/sizeSM), with bigger touch targets and higher-contrast borders.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  surface:                '#F6F3EE',
  surfaceContainerLowest: '#ffffff',
  surfaceVariant:         '#e5ded0',

  primary:   '#1C6267',
  secondary: '#E0662D',

  onSurface:        '#1F2937',
  onSurfaceVariant: '#4B5563',
} as const;

interface CreatorListItem {
  id: string;
  name: string;
  rating: number;
  skills: string[];
  languages: string[];
  contributionsCompleted: number;
  availableNow: boolean;
}

const PHOTOGRAPHERS: CreatorListItem[] = [
  {
    id: 'nimal-perera',
    name: 'Nimal Perera',
    rating: 4.8,
    skills: ['Photography', 'Video Documentation'],
    languages: ['Sinhala', 'English'],
    contributionsCompleted: 24,
    availableNow: true,
  },
  {
    id: 'kasun-perera',
    name: 'Kasun Perera',
    rating: 4.4,
    skills: ['Script Writing'],
    languages: ['Tamil', 'English'],
    contributionsCompleted: 14,
    availableNow: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
const PersonIcon: React.FC<{ size?: number }> = ({ size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="#ffffff" stroke="none">
    <Circle cx="12" cy="8" r="4" />
    <Path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
  </Svg>
);

const SearchIcon: React.FC<{ size?: number; color?: string }> = ({ size = 22, color = D.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="7" />
    <Path d="M16.5 16.5L21 21" />
  </Svg>
);

const ArrowRightIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </Svg>
);

const StarIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <Text style={{ fontSize: size, color: D.secondary, lineHeight: size + 2 }}>{'★'}</Text>
);

// ─────────────────────────────────────────────────────────────────────────────
// TopAppBar
// ─────────────────────────────────────────────────────────────────────────────
const TopAppBar: React.FC = () => (
  <View style={s.appBar}>
    <Pressable style={({ pressed }) => [s.iconBtn, pressed && s.pressed]} accessibilityRole="button" accessibilityLabel="Open menu">
      <View style={s.hamburger}>
        <View style={s.hamburgerLine} />
        <View style={s.hamburgerLine} />
        <View style={s.hamburgerLine} />
      </View>
    </Pressable>

    <Text style={s.appBarTitle}>LegacyLens</Text>

    <Pressable style={({ pressed }) => [s.iconBtn, pressed && s.pressed]} accessibilityRole="button" accessibilityLabel="Notifications">
      <View style={s.bellWrapper}>
        <View style={s.bellTop} />
        <View style={s.bellBody} />
        <View style={s.bellClapper} />
      </View>
    </Pressable>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// CreatorCard
// ─────────────────────────────────────────────────────────────────────────────
const CreatorCard: React.FC<{ item: CreatorListItem; onViewDetails: () => void }> = ({ item, onViewDetails }) => (
  <View style={s.card}>
    <View style={s.cardBody}>
      {/* Header row: avatar + name + rating */}
      <View style={s.headerRow}>
        <View style={s.headerLeft}>
          <View style={s.avatar}>
            <PersonIcon />
          </View>
          <Text style={s.name}>{item.name}</Text>
        </View>
        <View style={s.ratingRow}>
          <Text style={s.ratingValue}>{item.rating.toFixed(1)}</Text>
          <StarIcon />
        </View>
      </View>

      {/* Skill tags */}
      <View style={s.tagsRow}>
        {item.skills.map((skill) => (
          <View key={skill} style={s.tag}>
            <Text style={s.tagText}>{skill}</Text>
          </View>
        ))}
      </View>

      {/* Language + experience */}
      <View style={s.infoBlock}>
        <Text style={s.infoLabel}>Language</Text>
        <Text style={s.infoValue}>{item.languages.join('     ')}</Text>
        <Text style={[s.infoValue, { marginTop: Spacing.sm }]}>
          {`Experience : ${item.contributionsCompleted} contributions completed.`}
        </Text>
      </View>
    </View>

    {/* Bottom action bar */}
    <View style={s.actionBar}>
      <Text style={s.availableText}>{item.availableNow ? 'Available Now' : 'Not Available'}</Text>
      <Pressable
        onPress={onViewDetails}
        style={({ pressed }) => [s.viewDetailsBtn, pressed && s.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`View ${item.name}'s details`}
      >
        <Text style={s.viewDetailsText}>View Details</Text>
        <ArrowRightIcon />
      </Pressable>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const AvailableContentCreators: React.FC<{
  onNavigate: (tab: NavTab) => void;
  onViewDetails?: (creatorId: string) => void;
}> = ({ onNavigate, onViewDetails }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = PHOTOGRAPHERS.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.skills.some((skill) => skill.toLowerCase().includes(q)) ||
      c.languages.some((lang) => lang.toLowerCase().includes(q))
    );
  });

  const handleViewDetails = (creator: CreatorListItem) => {
    if (onViewDetails) {
      onViewDetails(creator.id);
    } else {
      Alert.alert(creator.name, 'This creator\'s full profile page isn\'t built yet.');
    }
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <TopAppBar />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.pageHeading}>Available Content Creators...</Text>

        <View style={s.searchBar}>
          <SearchIcon />
          <TextInput
            style={s.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Content Creator......."
            placeholderTextColor={D.onSurfaceVariant}
            accessibilityLabel="Search content creators"
          />
        </View>

        <Text style={s.sectionHeading}>Photographers...</Text>

        {filtered.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyStateText}>No content creators match your search.</Text>
          </View>
        ) : (
          <View style={{ gap: Spacing.md }}>
            {filtered.map((item) => (
              <CreatorCard key={item.id} item={item} onViewDetails={() => handleViewDetails(item)} />
            ))}
          </View>
        )}

        <View style={{ height: 8 }} />
      </ScrollView>

      <BottomNavBar activeTab="market" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

export default AvailableContentCreators;

// ─────────────────────────────────────────────────────────────────────────────
// Styles — text sizes deliberately larger than other creator-side screens
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },

  // ── App Bar ──────────────────────────────────────────────────────────────
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 64,
    backgroundColor: D.surfaceContainerLowest,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: D.surfaceVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconBtn: { width: 48, height: 48, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
  appBarTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    lineHeight: Typography.sizeXL * 1.2,
    color: D.primary,
    letterSpacing: -0.3,
  },
  hamburger:    { gap: 5 },
  hamburgerLine: { width: 24, height: 2.5, borderRadius: 1.5, backgroundColor: D.primary },
  bellWrapper: { alignItems: 'center' },
  bellTop:     { width: 4, height: 4, borderRadius: 2, backgroundColor: D.primary, marginBottom: 1 },
  bellBody:    { width: 18, height: 16, borderWidth: 2, borderColor: D.primary, borderRadius: 8, borderBottomWidth: 0 },
  bellClapper: { width: 6, height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, backgroundColor: D.primary },

  // ── Scroll ───────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },

  pageHeading: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXL,
    lineHeight: Typography.sizeXL * 1.25,
    color: D.onSurface,
  },

  // ── Search ───────────────────────────────────────────────────────────────
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.full,
    borderWidth: 1.5,
    borderColor: D.surfaceVariant,
    paddingHorizontal: Spacing.md,
    minHeight: 56,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: D.onSurface,
    paddingVertical: Spacing.sm,
  },

  sectionHeading: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeLG,
    color: D.onSurface,
  },

  emptyState: { paddingVertical: Spacing.xl, alignItems: 'center' },
  emptyStateText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, color: D.onSurfaceVariant },

  // ── Card ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: D.surfaceVariant,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardBody: { padding: Spacing.md, gap: Spacing.md },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexShrink: 1 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: D.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG, color: D.onSurface, flexShrink: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingValue: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG, color: D.onSurface },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tag: {
    borderWidth: 1.5, borderColor: D.primary, borderRadius: Radii.full,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  tagText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.primary },

  infoBlock: { gap: 4 },
  infoLabel: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.onSurface },
  infoValue: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.onSurface, lineHeight: 22 },

  actionBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1.5, borderTopColor: D.surfaceVariant,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: D.surfaceContainerLowest,
  },
  availableText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.primary },
  viewDetailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingVertical: 4 },
  viewDetailsText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.secondary },

  // ── Press feedback ───────────────────────────────────────────────────────
  pressed: { opacity: 0.75 },
});
