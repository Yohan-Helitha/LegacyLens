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
import { CreatorTopAppBar } from '../../../components/CreatorTopAppBar';
import { opportunityApi } from '../../../services/api/opportunityApi';
import type { OpportunityCardResponse } from '../../../types/opportunity';
import { resolveOpportunityImage, resolveAvatarImage } from '../../../utils/opportunityImages';
import { showsMatchBadge } from '../../../utils/matchLevel';
import { useAuthStore } from '../../../store/authStore';

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
type FilterKey  = 'all' | 'nearby' | 'photography' | 'writing' | 'documentation' | 'craft' | 'video';

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

/** How the work is done ("On-Site") and what kind it is (microphone + "Craft"), side by side. */
const TypeTags: React.FC<{ item: OpportunityCardResponse }> = ({ item }) =>
  item.locationType || item.category ? (
    <View style={s.tagsRow}>
      {!!item.locationType && (
        <View style={s.tagNeutral}>
          <Text style={s.tagNeutralText}>{item.locationType}</Text>
        </View>
      )}
      {!!item.category && (
        <View style={[s.tagNeutral, s.tagWithIcon]}>
          <Text style={s.tagIcon}>{'🎙'}</Text>
          <Text style={s.tagNeutralText}>{item.category}</Text>
        </View>
      )}
    </View>
  ) : null;

/** Where the work happens - the opportunity's own location, not the knowledge holder's home town. */
const PlaceLine: React.FC<{ item: OpportunityCardResponse }> = ({ item }) =>
  item.location ? (
    <View style={s.placeLine}>
      <LocationPinIcon size={13} />
      <Text style={s.placeText} numberOfLines={1}>{item.location}</Text>
    </View>
  ) : null;

// ─────────────────────────────────────────────────────────────────────────────
// Inline icon helpers (emoji / primitive, zero extra dependencies)
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────

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
  { key: 'craft',       label: 'Craft'       },
  { key: 'video',       label: 'Video'       },
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
// MatchBadgeInline - the "55% MATCH" pill for cards that have no big photo to sit on
// ─────────────────────────────────────────────────────────────────────────────
const MatchBadgeInline: React.FC<{ item: OpportunityCardResponse }> = ({ item }) =>
  showsMatchBadge(item.matchPercentage, item.matchLevel) ? (
    <View style={s.matchBadgeInline}>
      <Text style={s.matchStar}>{'★'}</Text>
      <Text style={s.matchText}>{item.matchPercentage}% MATCH</Text>
    </View>
  ) : null;

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
        {showsMatchBadge(item.matchPercentage, item.matchLevel) && (
          <View style={s.matchBadge}>
            <Text style={s.matchStar}>{'\u2605'}</Text>
            <Text style={s.matchText}>{item.matchPercentage}% MATCH</Text>
          </View>
        )}
      </View>

      <View style={s.recommendedBody}>
        {/* 1. who it is from, and where the work is */}
        {!!item.elderName && (
          <View style={s.authorRow}>
            <Image
              source={resolveAvatarImage(item.elderAvatarUrl) ?? { uri: PLACEHOLDER_AVATAR }}
              style={s.recommendedAvatar}
              accessibilityLabel={`${item.elderName} profile photo`}
            />
            <View style={s.authorText}>
              <Text style={s.holderName} numberOfLines={1}>{item.elderName}</Text>
              <PlaceLine item={item} />
            </View>
          </View>
        )}

        {/* 2. what kind of work it is */}
        <TypeTags item={item} />

        {/* 3. its name, and what it involves */}
        <Text style={s.cardTitle}>{item.title}</Text>
        {!!item.description && <Text style={s.recentDesc} numberOfLines={3}>{item.description}</Text>}
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
      {/* The percentage sits at the top right of the card; the picture and the job details come below it. */}
      {showsMatchBadge(item.matchPercentage, item.matchLevel) && (
        <View style={s.urgentBadgeTop}>
          <MatchBadgeInline item={item} />
        </View>
      )}
      <View style={s.urgentTop}>
        <Image
          source={resolveOpportunityImage(item.heroImageUrl)}
          style={s.urgentThumb}
          accessibilityLabel={item.title}
        />
        <View style={s.urgentHeading}>
          <Text style={s.urgentTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {!!item.elderName && <Text style={s.holderName} numberOfLines={1}>{`By ${item.elderName}`}</Text>}
          <PlaceLine item={item} />
          <TypeTags item={item} />
        </View>
      </View>
      {/* Starts at the card's left edge, under the picture, with room above it. */}
      <View style={s.urgentBody}>
        {!!item.description && <Text style={s.recentDesc} numberOfLines={3}>{item.description}</Text>}
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
      <View style={[s.authorRow, s.authorRowFit]}>
        <Image
          source={resolveAvatarImage(item.elderAvatarUrl) ?? { uri: PLACEHOLDER_AVATAR }}
          style={s.authorAvatar}
          accessibilityLabel={`${item.elderName} profile photo`}
        />
        <View style={s.authorText}>
          <Text style={s.authorName} numberOfLines={1}>{item.elderName}</Text>
          <PlaceLine item={item} />
        </View>
      </View>
      <MatchBadgeInline item={item} />
    </View>

    <View style={s.recentContent}>
      <TypeTags item={item} />
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
    </View>
  </Pressable>
);

// ─────────────────────────────────────────────────────────────────────────────
// RecentSection
// ─────────────────────────────────────────────────────────────────────────────
const RecentSection: React.FC<{
  title?: string;
  items: OpportunityCardResponse[];
  onApply: (id: string) => void;
  onViewDetail: (id: string) => void;
}> = ({ title = 'Recent Postings', items, onApply, onViewDetail }) => (
  <View style={s.section}>
    <Text style={s.sectionTitle}>{title}</Text>

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

/** What the page showed last time, kept for the signed-in account only so another login never sees it. */
interface BrowseSnapshot {
  userId: string | null;
  recommended: OpportunityCardResponse | null;
  urgent: OpportunityCardResponse | null;
  recent: OpportunityCardResponse[];
}
let lastBrowse: BrowseSnapshot | null = null;
const signedInUserId = () => useAuthStore.getState().user?.userId ?? null;
const remembered = (): BrowseSnapshot | null =>
  lastBrowse && lastBrowse.userId === signedInUserId() ? lastBrowse : null;

export const OpportunityPage: React.FC<{
  onNavigate: (tab: NavTab) => void;
  onViewDetail: (opportunityId: string) => void;
  onOpenMyWork: () => void;
  onOpenSavedApplications: () => void;
  onOpenRejectedWork: () => void;
}> = ({ onNavigate, onViewDetail, onOpenMyWork, onOpenSavedApplications, onOpenRejectedWork }) => {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Null only until the initial fetch settles — real data only, no fallback/mock content.
  // Starts from what the page showed last time (for this account), so the tab opens at once and refreshes behind it.
  const [seen] = useState(remembered);
  const [recommended, setRecommended] = useState<OpportunityCardResponse | null>(seen?.recommended ?? null);
  const [urgent, setUrgent] = useState<OpportunityCardResponse | null>(seen?.urgent ?? null);
  const [recent, setRecent] = useState<OpportunityCardResponse[] | null>(seen?.recent ?? null);

  // Populated by a real /opportunities/search call whenever a filter chip
  // other than "All" is active — null means "show the default All view"
  // rather than "no results", which filteredFilterResults.length === 0 covers.
  const [filterResults, setFilterResults] = useState<OpportunityCardResponse[] | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // One request for all three sections - the server works out the creator's matching once, not three times.
    opportunityApi
      .browse()
      .then((data) => {
        if (cancelled) return;
        const next = {
          userId: signedInUserId(),
          recommended: data.recommended[0] ?? null,
          urgent: data.urgent[0] ?? null,
          recent: data.recent,
        };
        lastBrowse = next;
        setRecommended(next.recommended);
        setUrgent(next.urgent);
        setRecent(next.recent);
      })
      .catch(() => {
        if (cancelled || remembered()) return;
        setRecommended(null);
        setUrgent(null);
        setRecent([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // What was typed, once the creator pauses - so the backend is asked once, not on every key press.
  const [typedText, setTypedText] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setTypedText(searchQuery.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // A filter chip or some typed text means a real search of every published opportunity on the backend;
  // with neither, the page shows its usual Recommended / Urgent / Recent sections.
  const searching = activeFilter !== 'all' || typedText.length > 0;

  useEffect(() => {
    if (!searching) {
      setFilterResults(null);
      return;
    }

    let cancelled = false;
    setFilterLoading(true);

    const category = activeFilter === 'nearby' ? undefined : FILTERS.find((f) => f.key === activeFilter)?.label;

    opportunityApi
      .search({ category: activeFilter === 'all' ? undefined : category, nearby: activeFilter === 'nearby', q: typedText || undefined, limit: 20 })
      .then((data) => {
        if (!cancelled) setFilterResults(data);
      })
      .catch(() => {
        if (!cancelled) setFilterResults([]);
      })
      .finally(() => {
        if (!cancelled) setFilterLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeFilter, typedText, searching]);

  const filteredFilterResults = filterResults ?? [];
  const activeFilterLabel = activeFilter === 'all' ? 'Search' : (FILTERS.find((f) => f.key === activeFilter)?.label ?? 'Filtered');

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <CreatorTopAppBar variant="menu" onOpenMyWork={onOpenMyWork} onOpenSavedApplications={onOpenSavedApplications} onOpenRejectedWork={onOpenRejectedWork} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <HeroSection />
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        <FilterBar active={activeFilter} onSelect={setActiveFilter} />

        {!searching ? (
          recent === null ? (
            <View style={s.emptyState}>
              <Text style={s.emptyStateText}>Loading…</Text>
            </View>
          ) : (
            <>
              {recommended && (
                <RecommendedCard item={recommended} onViewDetail={() => onViewDetail(recommended.id)} />
              )}
              {urgent && (
                <UrgentSection item={urgent} onViewDetail={() => onViewDetail(urgent.id)} />
              )}
              {recent.length > 0 && (
                <RecentSection items={recent} onApply={onViewDetail} onViewDetail={onViewDetail} />
              )}
              {!recommended && !urgent && recent.length === 0 && (
                <View style={s.emptyState}>
                  <Text style={s.emptyStateText}>No opportunities to show yet.</Text>
                </View>
              )}
            </>
          )
        ) : filterLoading ? (
          <View style={s.emptyState}>
            <Text style={s.emptyStateText}>Searching…</Text>
          </View>
        ) : filteredFilterResults.length > 0 ? (
          <RecentSection
            title={activeFilter === 'all' ? `Results for "${typedText}"` : `${activeFilterLabel} Opportunities`}
            items={filteredFilterResults}
            onApply={onViewDetail}
            onViewDetail={onViewDetail}
          />
        ) : (
          <View style={s.emptyState}>
            <Text style={s.emptyStateText}>
              {typedText
                ? 'No opportunities match your search.'
                : activeFilter === 'nearby'
                  ? 'No opportunities near your city yet — set your city in your profile to see nearby matches.'
                  : 'No opportunities match this filter.'}
            </Text>
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
  matchBadgeInline: {
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(20,20,20,0.55)',
    borderRadius: Radii.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  matchStar: { fontSize: 12, color: '#FFD166' },
  matchText: { fontFamily: Typography.fontBodySemi, fontSize: 10, color: '#ffffff', letterSpacing: 0.5 },
  recommendedBody: { padding: 16, gap: Spacing.sm },
  recommendedFacts: { gap: 6 },
  recommendedAvatar: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.outlineVariant,
  },
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
    minHeight: 32, textAlignVertical: 'center',
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
    gap: Spacing.md,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
  },
  urgentTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  urgentHeading:  { flex: 1, gap: 4 },
  holderName:     { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.primary },
  urgentThumb:    { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: Radii.xl, flexShrink: 0 },
  urgentBody:     { gap: Spacing.sm },
  urgentTitle:    { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, lineHeight: 24, color: D.onSurface },
  tagWithIcon:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagIcon:         { fontSize: 12 },
  authorText:      { flexShrink: 1, gap: 1 },
  authorRowFit:    { flexShrink: 1 },
  placeLine:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  placeText:       { flexShrink: 1, fontFamily: Typography.fontBody, fontSize: 12, color: D.onSurfaceVariant },
  urgentBadgeTop:  { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: -Spacing.xs },
  urgentMeta:     { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xs },
  urgentMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaIcon:       { fontSize: 14, lineHeight: 20 },
  urgentMetaText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },
  urgentCtaRow:   { alignItems: 'flex-end', marginTop: Spacing.xs },

  // ── Recent Card ────────────────────────────────────────────────────────────
  recentCard: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: 20,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
    gap: 6,
  },
  recentHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  authorRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  authorAvatar: {
    width: 40, height: 40, borderRadius: 20,
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
  recentContent:  { gap: 4 },
  recentDesc: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    lineHeight: 20,
    color: D.onSurfaceVariant,
  },
  recentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: D.surfaceVariant,
    paddingTop: Spacing.sm,
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
