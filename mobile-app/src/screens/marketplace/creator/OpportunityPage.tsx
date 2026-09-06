import React, { useEffect, useState } from 'react';
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
import Svg, { Path, Circle } from 'react-native-svg';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';
import { opportunityApi } from '../../../services/api/opportunityApi';
import type { OpportunityCardResponse } from '../../../types/opportunity';
import { resolveOpportunityImage, resolveAvatarImage } from '../../../utils/opportunityImages';

// ─────────────────────────────────────────────────────────────────────────────
// Local design tokens (mapped from HTML Tailwind config colour system)
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  // Brand palette (from design system)
  surface:                '#EDEFEE',          // Tertiary — page bg
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow:    '#f5f3ee',
  surfaceContainer:       '#e8f2f2',          // tinted teal wash
  surfaceContainerHigh:   '#d8e8e8',
  surfaceVariant:         '#c8dcdc',
  outlineVariant:         '#a0c4c4',

  primary:              '#0F5C5C',            // Primary teal
  onPrimary:            '#ffffff',
  primaryContainer:     '#0d4e4e',
  onPrimaryContainer:   '#e0f4f4',

  secondary:            '#E8792E',            // Secondary orange
  onSecondary:          '#ffffff',
  secondaryContainer:   '#fff0e6',
  onSecondaryContainer: '#9e4a0d',

  tertiary:          '#202428',              // Neutral dark
  tertiaryContainer: '#e8792e',
  tertiaryFixedDim:  '#f5a55a',
  tertiaryFixed:     '#fff0e6',

  onSurface:        '#202428',               // Neutral — text
  onSurfaceVariant: '#4a5568',
  outline:          '#718096',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type FilterKey  = 'all' | 'nearby' | 'photography' | 'writing' | 'documentation';

/** Shown for an elder with no uploaded profile photo. */
const PLACEHOLDER_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBdukQOb20lmYsNjgSC79bwk6nR11u86Bj87jNIlc_ZQzQ97BxLNMhydins5gSF08W2CSQyNGsh4guyGBVX0htKvkNTzRAY76Yfv8jK-W-9Z-cW30fTc-tVqTE_3MXVnOr3daWdokTEReYQUt-ciXqQB8LF7qkH10d4SgSRvnxi4hdlzLG5RUNcZvLxKkHwfHK5wXsfSfaNkQJdZelcgow41KGgsq77Fkd9zgLSrunJwEJsg3U5ZQcTdg';

/** Google Maps-style location pin, in the requested #336574 tone. */
const LocationPinIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M12 2C7.86 2 4.5 5.36 4.5 9.5c0 5.62 6.55 11.54 6.83 11.79a1 1 0 0 0 1.34 0c.28-.25 6.83-6.17 6.83-11.79C19.5 5.36 16.14 2 12 2z"
      fill="#336574"
    />
    <Circle cx="12" cy="9.5" r="2.6" fill="#ffffff" />
  </Svg>
);

function joinMeta(a: string | null | undefined, b: string | null | undefined): string {
  return [a, b].filter(Boolean).join(' · ');
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback data — shown only if the /api/opportunities/** call fails or
// returns nothing yet (e.g. no connectivity), so the screen never renders
// blank or broken.
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_RECOMMENDED: OpportunityCardResponse = {
  id: 'fallback-recommended',
  title: 'Traditional Fishing Terms Documentation.',
  description: '',
  heroImageUrl: 'local:fisheries',
  location: 'Negombo',
  category: 'Photography',
  locationType: null,
  matchPercentage: 70,
  urgent: false,
  dueAt: null,
  elderName: '',
  elderAvatarUrl: null,
  elderLocation: null,
  createdAt: new Date().toISOString(),
};

const FALLBACK_URGENT: OpportunityCardResponse = {
  id: 'fallback-urgent',
  title: 'Record Oral History: The 2004 Tsunami.',
  description: '',
  heroImageUrl: 'local:galle-coast',
  location: 'Galle',
  category: 'Oral History',
  locationType: null,
  matchPercentage: null,
  urgent: true,
  dueAt: new Date(Date.now() + 1 * 86400000).toISOString(),
  elderName: '',
  elderAvatarUrl: null,
  elderLocation: null,
  createdAt: new Date().toISOString(),
};

const FALLBACK_RECENT: OpportunityCardResponse[] = [
  {
    id: 'fallback-recent-1',
    title: 'Photograph Antique Mask Collection.',
    description:
      'Need high-resolution macro photography of traditional kolam masks for digital archive. Lighting equipment provided.',
    heroImageUrl: null,
    location: 'Galle Fort',
    category: 'Photography',
    locationType: 'On-Site',
    matchPercentage: null,
    urgent: false,
    dueAt: null,
    elderName: 'P. M. Amanda',
    elderAvatarUrl: PLACEHOLDER_AVATAR,
    elderLocation: 'Galle Fort',
    createdAt: new Date().toISOString(),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Inline icon helpers (emoji / primitive, zero extra dependencies)
// ─────────────────────────────────────────────────────────────────────────────


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
// HeroSection
// ─────────────────────────────────────────────────────────────────────────────
const HeroSection: React.FC = () => (
  <View style={s.heroSection}>
    <Text style={s.heroTitle}>Opportunities</Text>
    <Text style={s.heroSubtitle}>
      Find meaningful work that helps preserve local culture.
    </Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// SearchBar
// ─────────────────────────────────────────────────────────────────────────────
const SearchBar: React.FC<{ value: string; onChangeText: (text: string) => void }> = ({
  value,
  onChangeText,
}) => (
  <View style={s.searchWrapper}>
    <View style={s.searchIcon}>
      <View style={s.searchIconRing} />
      <View style={s.searchIconHandle} />
    </View>
    <TextInput
      style={s.searchInput}
      value={value}
      onChangeText={onChangeText}
      placeholder="Search opportunities..."
      placeholderTextColor={D.outline}
      returnKeyType="search"
      accessibilityLabel="Search opportunities"
      clearButtonMode="while-editing"
    />
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// FilterBar
// ─────────────────────────────────────────────────────────────────────────────
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',         label: 'All'         },
  { key: 'nearby',      label: 'Nearby'      },
  { key: 'photography', label: 'Photography' },
  { key: 'writing',     label: 'Writing'     },
  { key: 'documentation', label: 'Documentation' },
];

const FilterBar: React.FC<{
  active: FilterKey;
  onSelect: (k: FilterKey) => void;
}> = ({ active, onSelect }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={s.filterRow}
  >
    {FILTERS.map(f => (
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
        <Text style={[s.filterChipText, active === f.key && s.filterChipTextActive]}>
          {f.label}
        </Text>
      </Pressable>
    ))}
  </ScrollView>
);

// ─────────────────────────────────────────────────────────────────────────────
// RecommendedCard
// ─────────────────────────────────────────────────────────────────────────────
const RecommendedCard: React.FC<{ item: OpportunityCardResponse; onViewDetail: () => void }> = ({
  item,
  onViewDetail,
}) => (
  <View style={s.section}>
    <Text style={s.sectionTitle}>Recommended For You</Text>

    <Pressable
      style={({ pressed }) => [s.recommendedCard, pressed && s.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${item.title} opportunity`}
    >
      <View style={s.recommendedImgWrapper}>
        <Image
          source={resolveOpportunityImage(item.heroImageUrl)}
          style={s.recommendedImg}
          accessibilityLabel={item.title}
        />
        {item.matchPercentage != null && (
          <View style={s.matchBadge}>
            <Text style={s.matchStar}>{'\u2605'}</Text>
            <Text style={s.matchText}>{item.matchPercentage}% MATCH</Text>
          </View>
        )}
      </View>

      <View style={s.recommendedBody}>
        <View style={{ gap: 4 }}>
          <Text style={s.cardTitle}>{item.title}</Text>
          <Text style={s.cardMeta}>{joinMeta(item.location, item.category)}</Text>
        </View>
        <View style={s.cardCta}>
          <Pressable
            onPress={onViewDetail}
            style={({ pressed }) => pressed ? [s.pressed] : []}
            accessibilityRole="button"
          >
            <Text style={s.ctaTextPrimary}>{'View Opportunity  \u2192'}</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// UrgentSection
// ─────────────────────────────────────────────────────────────────────────────
const UrgentSection: React.FC<{ item: OpportunityCardResponse; onViewDetail: () => void }> = ({
  item,
  onViewDetail,
}) => (
  <View style={s.section}>
    <View style={s.urgentTitleRow}>
      <Text style={{ fontSize: 18 }}>{'\uD83D\uDD25'}</Text>
      <Text style={s.sectionTitle}>Urgent Missions</Text>
    </View>

    <Pressable
      style={({ pressed }) => [s.urgentCard, pressed && s.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${item.title} opportunity`}
    >
      <Image
        source={resolveOpportunityImage(item.heroImageUrl)}
        style={s.urgentThumb}
        accessibilityLabel={item.title}
      />
      <View style={s.urgentBody}>
        <Text style={s.urgentTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={s.urgentMeta}>
          <View style={s.urgentMetaItem}>
            <Text style={s.metaIcon}>{'\uD83C\uDF99'}</Text>
            <Text style={s.urgentMetaText}>{item.category}</Text>
          </View>
          <View style={s.urgentMetaItem}>
            <LocationPinIcon size={14} />
            <Text style={s.urgentMetaText}>{item.location}</Text>
          </View>
        </View>
        <View style={s.urgentCtaRow}>
          <Pressable
            onPress={onViewDetail}
            style={({ pressed }) => pressed ? [s.pressed] : []}
            accessibilityRole="button"
          >
            <Text style={s.ctaTextSecondary}>{'View Opportunity  \u2192'}</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// RecentOpportunityCard
// ─────────────────────────────────────────────────────────────────────────────
const RecentOpportunityCard: React.FC<{
  item: OpportunityCardResponse;
  onApply: () => void;
  onViewDetail: () => void;
}> = ({ item, onApply, onViewDetail }) => (
  <Pressable
    style={({ pressed }) => [s.recentCard, pressed && s.cardPressed]}
    accessibilityRole="button"
    accessibilityLabel={`${item.title} opportunity`}
  >
    <View style={s.recentHeader}>
      <View style={s.authorRow}>
        <Image
          source={resolveAvatarImage(item.elderAvatarUrl) ?? { uri: PLACEHOLDER_AVATAR }}
          style={s.authorAvatar}
          accessibilityLabel={`${item.elderName} profile photo`}
        />
        <View>
          <Text style={s.authorName}>{item.elderName}</Text>
          <Text style={s.authorLocation}>{item.elderLocation}</Text>
        </View>
      </View>
      <View style={s.tagsRow}>
        {item.category && (
          <View style={s.tagSecondary}>
            <Text style={s.tagSecondaryText}>{item.category}</Text>
          </View>
        )}
        {item.locationType && (
          <View style={s.tagNeutral}>
            <Text style={s.tagNeutralText}>{item.locationType}</Text>
          </View>
        )}
      </View>
    </View>

    <View style={s.recentContent}>
      <Text style={s.cardTitle}>{item.title}</Text>
      <Text style={s.recentDesc} numberOfLines={2}>
        {item.description}
      </Text>
    </View>

    <View style={s.recentActions}>
      <Pressable
        onPress={onViewDetail}
        style={({ pressed }) => pressed ? [s.pressed] : []}
        accessibilityRole="button"
      >
        <Text style={s.ctaTextMuted}>{'View Opportunity  \u2192'}</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [s.applyBtn, pressed && s.pressed]}
        onPress={onApply}
        accessibilityRole="button"
        accessibilityLabel={`Apply for ${item.title}`}
      >
        <Text style={s.applyBtnText}>Apply</Text>
      </Pressable>
    </View>
  </Pressable>
);

// ─────────────────────────────────────────────────────────────────────────────
// RecentSection
// ─────────────────────────────────────────────────────────────────────────────
const RecentSection: React.FC<{
  items: OpportunityCardResponse[];
  onApply: (id: string) => void;
  onViewDetail: (id: string) => void;
}> = ({ items, onApply, onViewDetail }) => (
  <View style={s.section}>
    <Text style={s.sectionTitle}>Recent Postings</Text>

    <View style={{ gap: Spacing.md }}>
      {items.map((item) => (
        <RecentOpportunityCard
          key={item.id}
          item={item}
          onApply={() => onApply(item.id)}
          onViewDetail={() => onViewDetail(item.id)}
        />
      ))}
    </View>
  </View>
);



// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const OpportunityPage: React.FC<{
  onNavigate: (tab: NavTab) => void;
  onViewDetail: (opportunityId: string) => void;
}> = ({ onNavigate, onViewDetail }) => {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [recommended, setRecommended] = useState<OpportunityCardResponse>(FALLBACK_RECOMMENDED);
  const [urgent, setUrgent] = useState<OpportunityCardResponse | null>(FALLBACK_URGENT);
  const [recent, setRecent] = useState<OpportunityCardResponse[]>(FALLBACK_RECENT);

  useEffect(() => {
    opportunityApi
      .getRecommended(1)
      .then((data) => {
        if (data.length > 0) setRecommended(data[0]);
      })
      .catch(() => {});

    opportunityApi
      .getUrgent(1)
      .then((data) => setUrgent(data.length > 0 ? data[0] : null))
      .catch(() => {});

    opportunityApi
      .getRecent(10)
      .then((data) => {
        if (data.length > 0) setRecent(data);
      })
      .catch(() => {});
  }, []);

  const matchesFilters = (item: OpportunityCardResponse): boolean => {
    // 'nearby' needs the creator's own location to mean anything — no proximity
    // data is available client-side yet, so it passes through like 'all' for now.
    if (activeFilter !== 'all' && activeFilter !== 'nearby') {
      const category = (item.category ?? '').toLowerCase();
      if (!category.includes(activeFilter)) return false;
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      (item.location ?? '').toLowerCase().includes(q) ||
      (item.category ?? '').toLowerCase().includes(q)
    );
  };

  const showRecommended = matchesFilters(recommended);
  const showUrgent = urgent != null && matchesFilters(urgent);
  const filteredRecent = recent.filter(matchesFilters);
  const hasAnyResults = showRecommended || showUrgent || filteredRecent.length > 0;

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
        <HeroSection />
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        <FilterBar active={activeFilter} onSelect={setActiveFilter} />
        {showRecommended && (
          <RecommendedCard item={recommended} onViewDetail={() => onViewDetail(recommended.id)} />
        )}
        {showUrgent && urgent && (
          <UrgentSection item={urgent} onViewDetail={() => onViewDetail(urgent.id)} />
        )}
        {filteredRecent.length > 0 && (
          <RecentSection items={filteredRecent} onApply={onViewDetail} onViewDetail={onViewDetail} />
        )}
        {!hasAnyResults && (
          <View style={s.emptyState}>
            <Text style={s.emptyStateText}>No opportunities match your search.</Text>
          </View>
        )}
        <View style={{ height: 8 }} />
      </ScrollView>

      <BottomNavBar activeTab="market" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

export default OpportunityPage;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const THUMB_SIZE = 72;

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
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },

  // ── Hero ───────────────────────────────────────────────────────────────────
  heroSection: { gap: Spacing.xs },
  heroTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,      // 24sp — standard h1 for mobile
    lineHeight: 32,
    letterSpacing: -0.3,
    color: '#0F5C5C',                 // Primary teal (30% rule)
    fontWeight: '700',
  },
  heroSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,      // 16sp — standard body
    lineHeight: 26,
    color: D.onSurfaceVariant,
  },

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
  filterRow:            { flexDirection: 'row', gap: Spacing.sm, paddingBottom: 4 },
  filterChip:           {
    paddingHorizontal: 16,
    paddingVertical: 11,              // 11+11+11 line ≈ 44pt touch target
    borderRadius: Radii.lg,
    minHeight: 44,
    justifyContent: 'center',
  },
  filterChipActive:     { backgroundColor: '#0F5C5C' },  // teal (30% rule)
  filterChipInactive:   {
    backgroundColor: D.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
  },
  filterChipText:       { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurfaceVariant, letterSpacing: 0.4 },
  filterChipTextActive: { color: '#ffffff' },

  // ── Section ────────────────────────────────────────────────────────────────
  section:          { gap: Spacing.sm },
  sectionTitle:     {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeLG,      // 18sp — section heading
    lineHeight: 28,
    color: D.onSurface,
    letterSpacing: -0.1,
  },
  urgentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },

  // ── Recommended Card ───────────────────────────────────────────────────────
  recommendedCard: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  recommendedImgWrapper: { width: '100%', height: 192, backgroundColor: D.surfaceContainerHigh },
  recommendedImg:        { width: '100%', height: '100%' },
  matchBadge: {
    position: 'absolute', top: 16, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(20,20,20,0.55)',
    borderRadius: Radii.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  matchStar: { fontSize: 12, color: '#FFD166' },
  matchText: { fontFamily: Typography.fontBodySemi, fontSize: 10, color: '#ffffff', letterSpacing: 0.5 },
  recommendedBody: { padding: 16, gap: Spacing.sm },
  cardCta: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: D.surfaceVariant,
    paddingTop: Spacing.sm,
    alignItems: 'flex-end',
  },
  // All three CTA link styles use orange (10% accent rule)
  ctaTextPrimary:  {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,      // 16sp
    color: '#E8792E',                 // orange accent
    minHeight: 44, textAlignVertical: 'center',
  },
  ctaTextSecondary: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,      // 14sp
    color: '#E8792E',                 // same orange for all View Opportunity links
    minHeight: 44, textAlignVertical: 'center',
  },
  ctaTextMuted: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,      // 14sp
    color: '#E8792E',                 // orange (was muted gray — unified per request)
    minHeight: 44, textAlignVertical: 'center',
  },
  cardTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeLG,      // 18sp — card title
    lineHeight: 26,
    color: D.onSurface,
  },
  cardMeta: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,      // 14sp — secondary info
    color: D.onSurfaceVariant,
    marginTop: 2,
  },
  cardPressed: { opacity: 0.92, elevation: 0 },

  // ── Urgent Card ────────────────────────────────────────────────────────────
  urgentCard: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.md,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
  },
  urgentThumb:    { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: Radii.xl, flexShrink: 0 },
  urgentBody:     { flex: 1, justifyContent: 'space-between', paddingVertical: 4 },
  urgentTitle:    { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, lineHeight: 24, color: D.onSurface },
  urgentMeta:     { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xs },
  urgentMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaIcon:       { fontSize: 14, lineHeight: 20 },
  urgentMetaText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },
  urgentCtaRow:   { alignItems: 'flex-end', marginTop: Spacing.xs },

  // ── Recent Card ────────────────────────────────────────────────────────────
  recentCard: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: 20,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
    gap: Spacing.sm,
  },
  recentHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  authorRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  authorAvatar: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.outlineVariant,
  },
  authorName:     { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onSurface },
  authorLocation: { fontFamily: Typography.fontBody,     fontSize: 12, color: D.onSurfaceVariant, marginTop: 1 },
  tagsRow:        { flexDirection: 'row', gap: 6 },
  tagSecondary: {
    backgroundColor: 'rgba(15, 92, 92, 0.10)',  // teal at 10%
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15, 92, 92, 0.20)',
    borderRadius: Radii.md,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  tagSecondaryText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: '#0F5C5C' },
  tagNeutral: {
    backgroundColor: D.surfaceContainer,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    borderRadius: Radii.md,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  tagNeutralText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },
  recentContent:  { gap: 6 },
  recentDesc: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    lineHeight: 20,
    color: D.onSurfaceVariant,
  },
  recentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: D.surfaceVariant,
    paddingTop: Spacing.md,
  },
  applyBtn: {
    backgroundColor: '#0F5C5C',       // teal (30% — primary action)
    borderRadius: Radii.xl,
    paddingHorizontal: 24,
    paddingVertical: 12,              // 12+12+~20 line = 44pt touch target
    minHeight: 44,
    justifyContent: 'center',
    shadowColor: '#0F5C5C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  applyBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: '#ffffff' },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyStateText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
  },

  // ── Press feedback ─────────────────────────────────────────────────────────
  pressed: { opacity: 0.75 },
});
