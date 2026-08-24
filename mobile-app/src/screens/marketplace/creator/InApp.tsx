import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';

// Reusing the two elder portraits already bundled for the Opportunity feature —
// this screen has no messaging backend yet (see note below), so conversation
// content here is static frontend data only.
const KAMALA_AVATAR = require('../../../../assets/images/avatars/elder-woman.png');
const SUNIL_AVATAR = require('../../../../assets/images/avatars/elder-veranda.png');

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — same palette as every other creator screen (Dashboard,
// OpportunityPage, OpportunityDetailPage): #0F5C5C teal stays primary for
// consistency, #E8792E is the accent, #336574 is reserved for the icons that
// already use it (location pin), matching how the rest of the app is built.
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  surface:                '#EDEFEE',
  surfaceContainerLowest: '#ffffff',
  surfaceContainer:       '#e8f2f2',
  surfaceVariant:         '#c8dcdc',
  outlineVariant:         '#a0c4c4',

  primary:   '#0F5C5C',
  secondary: '#E8792E',
  accentBlue: '#336574',

  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',
  outline:          '#718096',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type FilterKey = 'all' | 'unread' | 'collaborations';

type Conversation = {
  id: string;
  name: string;
  avatar: number;
  preview: string;
  timestamp: string;
  unread: boolean;
};

// Static for now — there's no messaging backend/table yet (this would need a
// real-time chat feature, which is out of scope for the current build). Kept
// as plain frontend data, same as the rest of the app's demo-only screens.
const CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    name: 'Mrs. Kamala Wijesinghe',
    avatar: KAMALA_AVATAR,
    preview: 'Traditional recipe documentation.',
    timestamp: '10.40 AM',
    unread: true,
  },
  {
    id: '2',
    name: 'Mr. Sunil Perera',
    avatar: SUNIL_AVATAR,
    preview: 'Fishing Terms Documentation.',
    timestamp: 'Yesterday',
    unread: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
const SearchIcon: React.FC = () => (
  <View style={s.searchIcon}>
    <View style={s.searchIconRing} />
    <View style={s.searchIconHandle} />
  </View>
);

const EditIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// TopAppBar
// ─────────────────────────────────────────────────────────────────────────────
const TopAppBar: React.FC = () => (
  <View style={s.appBar}>
    <Pressable
      style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
    >
      <View style={s.hamburger}>
        <View style={s.hamburgerLine} />
        <View style={s.hamburgerLine} />
        <View style={s.hamburgerLine} />
      </View>
    </Pressable>

    <Text style={s.appBarTitle}>Legacy Lens</Text>

    <Pressable
      style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Notifications"
    >
      <View style={s.bellWrapper}>
        <View style={s.bellTop} />
        <View style={s.bellBody} />
        <View style={s.bellClapper} />
      </View>
    </Pressable>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// FilterBar
// ─────────────────────────────────────────────────────────────────────────────
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',             label: 'All'             },
  { key: 'unread',          label: 'Unread'          },
  { key: 'collaborations',  label: 'Collaborations'  },
];

const FilterBar: React.FC<{ active: FilterKey; onSelect: (k: FilterKey) => void }> = ({ active, onSelect }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={s.filterRow}
  >
    {FILTERS.map((f) => (
      <Pressable
        key={f.key}
        onPress={() => onSelect(f.key)}
        style={({ pressed }) => [
          s.filterChip,
          active === f.key ? s.filterChipActive : s.filterChipInactive,
          pressed && s.pressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: active === f.key }}
      >
        <Text style={[s.filterChipText, active === f.key && s.filterChipTextActive]}>{f.label}</Text>
      </Pressable>
    ))}
  </ScrollView>
);

// ─────────────────────────────────────────────────────────────────────────────
// ConversationCard
// ─────────────────────────────────────────────────────────────────────────────
const ConversationCard: React.FC<{ item: Conversation }> = ({ item }) => (
  <Pressable
    style={({ pressed }) => [s.conversationCard, pressed && s.cardPressed]}
    accessibilityRole="button"
    accessibilityLabel={`Conversation with ${item.name}`}
  >
    <View style={s.avatarWrapper}>
      <Image source={item.avatar} style={s.avatar} accessibilityLabel={`${item.name} profile photo`} />
      {item.unread && <View style={s.unreadDot} />}
    </View>

    <View style={s.conversationBody}>
      <View style={s.conversationHeaderRow}>
        <Text style={[s.conversationName, item.unread && s.conversationNameUnread]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={s.conversationTime}>{item.timestamp}</Text>
      </View>
      <Text
        style={[s.conversationPreview, item.unread && s.conversationPreviewUnread]}
        numberOfLines={1}
      >
        {item.preview}
      </Text>
    </View>
  </Pressable>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const InApp: React.FC<{ onNavigate: (tab: NavTab) => void }> = ({ onNavigate }) => {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const visibleConversations = CONVERSATIONS.filter((c) => {
    if (activeFilter === 'unread' && !c.unread) return false;
    // 'collaborations' has no backing data yet — falls through to show everything.
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q);
  });

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
        <View style={s.headerRow}>
          <Text style={s.pageHeading}>Messages</Text>
          <Pressable
            style={({ pressed }) => [s.moreBtn, pressed && s.pressed]}
            accessibilityRole="button"
            accessibilityLabel="More options"
          >
            <Text style={s.moreDots}>{'⋮'}</Text>
          </Pressable>
        </View>

        <View style={s.searchWrapper}>
          <SearchIcon />
          <TextInput
            style={s.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Messages..."
            placeholderTextColor={D.outline}
            returnKeyType="search"
            accessibilityLabel="Search messages"
            clearButtonMode="while-editing"
          />
        </View>

        <FilterBar active={activeFilter} onSelect={setActiveFilter} />

        {visibleConversations.length > 0 ? (
          <View style={{ gap: Spacing.sm }}>
            {visibleConversations.map((item) => (
              <ConversationCard key={item.id} item={item} />
            ))}
          </View>
        ) : (
          <View style={s.emptyState}>
            <Text style={s.emptyStateText}>No conversations match.</Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating "New Message" action button */}
      <Pressable
        style={({ pressed }) => [s.fab, pressed && s.fabPressed]}
        accessibilityRole="button"
        accessibilityLabel="New message"
      >
        <EditIcon />
      </Pressable>

      <BottomNavBar activeTab="inbox" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

export default InApp;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },

  // ── App Bar ────────────────────────────────────────────────────────────────
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 56,
    backgroundColor: D.surfaceContainerLowest,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: D.surfaceVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: Radii.full,
    alignItems: 'center', justifyContent: 'center',
  },
  appBarTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG,
    lineHeight: Typography.sizeLG * 1.4,
    color: D.primary,
    letterSpacing: -0.3,
  },
  hamburger:     { gap: 4 },
  hamburgerLine: { width: 18, height: 2, borderRadius: 1, backgroundColor: D.secondary },
  bellWrapper:   { alignItems: 'center' },
  bellTop:       { width: 3, height: 3, borderRadius: 1.5, backgroundColor: D.secondary, marginBottom: 1 },
  bellBody:      { width: 14, height: 13, borderWidth: 1.5, borderColor: D.secondary, borderRadius: 7, borderBottomWidth: 0 },
  bellClapper:   { width: 5, height: 2, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, backgroundColor: D.secondary },

  // ── Scroll ─────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageHeading: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXL,
    lineHeight: 32,
    color: D.onSurface,
    letterSpacing: -0.2,
  },
  moreBtn: { width: 40, height: 40, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
  moreDots: { fontSize: 20, color: D.onSurfaceVariant, lineHeight: 22 },

  // ── Search ─────────────────────────────────────────────────────────────────
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    paddingHorizontal: Spacing.md,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon:  { width: 16, height: 16, marginRight: Spacing.sm },
  searchIconRing: {
    width: 11, height: 11, borderRadius: 6,
    borderWidth: 1.6, borderColor: D.primary,
  },
  searchIconHandle: {
    position: 'absolute', right: 0, bottom: 0,
    width: 6, height: 1.6, borderRadius: 1,
    backgroundColor: D.primary,
    transform: [{ rotate: '45deg' }],
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurface,
    paddingVertical: 12,
  },

  // ── Filters ────────────────────────────────────────────────────────────────
  filterRow: { flexDirection: 'row', gap: Spacing.sm, paddingBottom: 4 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radii.lg,
    minHeight: 40,
    justifyContent: 'center',
  },
  filterChipActive:     { backgroundColor: D.primary },
  filterChipInactive: {
    backgroundColor: D.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
  },
  filterChipText:       { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurfaceVariant, letterSpacing: 0.4 },
  filterChipTextActive: { color: '#ffffff' },

  // ── Conversation card ──────────────────────────────────────────────────────
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 1,
  },
  cardPressed: { opacity: 0.92 },
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.outlineVariant,
  },
  unreadDot: {
    position: 'absolute', top: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: D.secondary,
    borderWidth: 2, borderColor: D.surfaceContainerLowest,
  },
  conversationBody: { flex: 1, gap: 3 },
  conversationHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: Spacing.sm },
  conversationName: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeMD,
    color: D.onSurface,
    flexShrink: 1,
  },
  conversationNameUnread: { fontFamily: Typography.fontBodySemi },
  conversationTime: { fontFamily: Typography.fontBody, fontSize: 11, color: D.onSurfaceVariant, flexShrink: 0 },
  conversationPreview: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
  },
  conversationPreviewUnread: { fontFamily: Typography.fontBodyMed, color: D.onSurface },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyState:     { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyStateText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  // ── Floating action button ─────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    right: Spacing.md,
    bottom: 88,
    width: 56, height: 56, borderRadius: 20,
    backgroundColor: D.secondary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: D.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  fabPressed: { opacity: 0.9 },

  // ── Press feedback ─────────────────────────────────────────────────────────
  pressed: { opacity: 0.75 },
});
