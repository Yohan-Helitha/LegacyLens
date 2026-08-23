import React, { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';

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
type FilterKey  = 'all' | 'nearby' | 'photography' | 'writing';

type TagVariant = 'secondary' | 'neutral';

type RecentOpportunityItem = {
  id: string;
  authorName: string;
  authorLocation: string;
  authorAvatarUri: string;
  tags: { label: string; variant: TagVariant }[];
  title: string;
  description: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Mock data — placeholder until opportunities are actually published by an
// admin (elder submits → admin reviews → admin publishes is not built yet).
// ─────────────────────────────────────────────────────────────────────────────
const RECENT_AUTHOR_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBdukQOb20lmYsNjgSC79bwk6nR11u86Bj87jNIlc_ZQzQ97BxLNMhydins5gSF08W2CSQyNGsh4guyGBVX0htKvkNTzRAY76Yfv8jK-W-9Z-cW30fTc-tVqTE_3MXVnOr3daWdokTEReYQUt-ciXqQB8LF7qkH10d4SgSRvnxi4hdlzLG5RUNcZvLxKkHwfHK5wXsfSfaNkQJdZelcgow41KGgsq77Fkd9zgLSrunJwEJsg3U5ZQcTdg';

const MOCK_RECENT_OPPORTUNITIES: RecentOpportunityItem[] = [
  {
    id: '1',
    authorName: 'P. M. Amanda',
    authorLocation: 'Galle Fort',
    authorAvatarUri: RECENT_AUTHOR_AVATAR,
    tags: [
      { label: 'Photography', variant: 'secondary' },
      { label: 'On-Site', variant: 'neutral' },
    ],
    title: 'Photograph Antique Mask Collection.',
    description:
      'Need high-resolution macro photography of traditional kolam masks for digital archive. Lighting equipment provided.',
  },
  {
    id: '2',
    authorName: 'Nimal Rathnayake',
    authorLocation: 'Kandy',
    authorAvatarUri: RECENT_AUTHOR_AVATAR,
    tags: [
      { label: 'Oral History', variant: 'secondary' },
      { label: 'Remote OK', variant: 'neutral' },
    ],
    title: 'Interview Retired Tea Estate Workers.',
    description:
      'Looking for someone to record interviews with retired tea pluckers about daily life on the estate in the 1960s.',
  },
  {
    id: '3',
    authorName: 'Chamari Silva',
    authorLocation: 'Jaffna',
    authorAvatarUri: RECENT_AUTHOR_AVATAR,
    tags: [
      { label: 'Writing', variant: 'secondary' },
      { label: 'On-Site', variant: 'neutral' },
    ],
    title: 'Document a Family Recipe Book.',
    description:
      'Need help transcribing and translating a handwritten Tamil recipe book that has been passed down for three generations.',
  },
  {
    id: '4',
    authorName: 'Saman Kumara',
    authorLocation: 'Anuradhapura',
    authorAvatarUri: RECENT_AUTHOR_AVATAR,
    tags: [
      { label: 'Video', variant: 'secondary' },
      { label: 'On-Site', variant: 'neutral' },
    ],
    title: 'Record Traditional Drum-Making Process.',
    description:
      'Want a short documentary on how our family has hand-made traditional geta bera drums for generations.',
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
const SearchBar: React.FC = () => (
  <View style={s.searchWrapper}>
    <Text style={s.searchIcon}>{'\uD83D\uDD0D'}</Text>
    <TextInput
      style={s.searchInput}
      placeholder="Search opportunities..."
      placeholderTextColor={D.outline}
      returnKeyType="search"
      accessibilityLabel="Search opportunities"
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
const RecommendedCard: React.FC<{ onViewDetail: () => void }> = ({ onViewDetail }) => (
  <View style={s.section}>
    <Text style={s.sectionTitle}>Recommended For You</Text>

    <Pressable
      style={({ pressed }) => [s.recommendedCard, pressed && s.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel="Traditional fishing Terms Documentation opportunity"
    >
      <View style={s.recommendedImgWrapper}>
        <Image
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFr_TbcDqpHAlACc9VJ5pActhPIFGIsUJ5Val-M3PTLC8liXo9lhIPWRmRLTMdt7SATshX_8VwcUiJR1eqHCDiDuAln_uGewTtk4vmOjRFMTqLjR1nKQgnlc71zSDsHzVIGqsZ1k1hSQrZuLi3ala7icWEN17LBpFIR1mcTipGJsFpRRjPH4axYH_wtiVcVxHP7IFId9YFNYXPncgm0hEUHyjaMrnnu1HDSgmnJJUkQ7QaNl4RBfUvEw' }}
          style={s.recommendedImg}
          accessibilityLabel="Traditional stilt fishermen at sunset"
        />
        <View style={s.matchBadge}>
          <Text style={s.matchStar}>{'★'}</Text>
          <Text style={s.matchText}>88% MATCH</Text>
        </View>
        <Pressable
          style={({ pressed }) => [s.bookmarkBtn, pressed && s.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Bookmark this opportunity"
        >
          <Text style={{ fontSize: 16 }}>{'\uD83D\uDD16'}</Text>
        </Pressable>
      </View>

      <View style={s.recommendedBody}>
        <View style={{ gap: 4 }}>
          <Text style={s.cardTitle}>Traditional fishing Terms Documentation.</Text>
          <Text style={s.cardMeta}>
            {'Negombo (Sinhala) \u00B7 Linguistic Preservation Project'}
          </Text>
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
const UrgentSection: React.FC<{ onViewDetail: () => void }> = ({ onViewDetail }) => (
  <View style={s.section}>
    <View style={s.sectionHeaderRow}>
      <View style={s.urgentTitleRow}>
        <Text style={{ fontSize: 18 }}>{'\uD83D\uDD25'}</Text>
        <Text style={s.sectionTitle}>Urgent Missions</Text>
      </View>
      <View style={s.dueBadge}>
        <Text style={s.dueBadgeText}>Due in 3 days</Text>
      </View>
    </View>

    <Pressable
      style={({ pressed }) => [s.urgentCard, pressed && s.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel="Record Oral History: The 2004 Tsunami opportunity"
    >
      <Image
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNuYBn9vgG-Scml9WfKG-IA5mKz3UpPYXevIrDmEWaiYMqQX4Kj_zP7RwweCA8hq8LF4I-B8XwDZR3V04dMiatepJP6eeAmeCNW6dlwaSASf5iNnszv_If-_W8mmH2vkSs1_BK4_IIftYhP2egnPNYWOl2x_hUMwiCq2vKwgB5Y6R5h5C4uK_yl4ZUbhMRQ1S5_d2BhTQfNcnA1Btr-jDRRTzFWyqduDzamQG4hKOa-iSiSGNmQNaifQ' }}
        style={s.urgentThumb}
        accessibilityLabel="Galle Fort coastal ruins documentary photo"
      />
      <View style={s.urgentBody}>
        <Text style={s.urgentTitle} numberOfLines={2}>
          {'Record Oral History: The 2004 Tsunami.'}
        </Text>
        <View style={s.urgentMeta}>
          <View style={s.urgentMetaItem}>
            <Text style={s.metaIcon}>{'\uD83C\uDF99'}</Text>
            <Text style={s.urgentMetaText}>Oral History</Text>
          </View>
          <View style={s.urgentMetaItem}>
            <Text style={s.metaIcon}>{'\uD83D\uDCCD'}</Text>
            <Text style={s.urgentMetaText}>Galle</Text>
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
  item: RecentOpportunityItem;
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
          source={{ uri: item.authorAvatarUri }}
          style={s.authorAvatar}
          accessibilityLabel={`${item.authorName} profile photo`}
        />
        <View>
          <Text style={s.authorName}>{item.authorName}</Text>
          <Text style={s.authorLocation}>{item.authorLocation}</Text>
        </View>
      </View>
      <View style={s.tagsRow}>
        {item.tags.map((tag) => (
          <View
            key={tag.label}
            style={tag.variant === 'secondary' ? s.tagSecondary : s.tagNeutral}
          >
            <Text style={tag.variant === 'secondary' ? s.tagSecondaryText : s.tagNeutralText}>
              {tag.label}
            </Text>
          </View>
        ))}
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
const RecentSection: React.FC<{ onApply: () => void; onViewDetail: () => void }> = ({ onApply, onViewDetail }) => (
  <View style={s.section}>
    <Text style={s.sectionTitle}>Recent Postings</Text>

    <View style={{ gap: Spacing.md }}>
      {MOCK_RECENT_OPPORTUNITIES.map((item) => (
        <RecentOpportunityCard key={item.id} item={item} onApply={onApply} onViewDetail={onViewDetail} />
      ))}
    </View>
  </View>
);



// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const OpportunityPage: React.FC<{
  onNavigate: (tab: NavTab) => void;
  onApply: () => void;
}> = ({ onNavigate, onApply }) => {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

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
        <SearchBar />
        <FilterBar active={activeFilter} onSelect={setActiveFilter} />
        <RecommendedCard onViewDetail={onApply} />
        <UrgentSection onViewDetail={onApply} />
        <RecentSection onApply={onApply} onViewDetail={onApply} />
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
const THUMB_SIZE = 96;

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
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
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
  searchIcon:  { fontSize: 16, marginRight: Spacing.sm },
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
  section:          { gap: Spacing.md },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle:     {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeLG,      // 18sp — section heading
    lineHeight: 28,
    color: D.onSurface,
    letterSpacing: -0.1,
  },
  urgentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dueBadge: {
    backgroundColor: 'rgba(255,223,152,0.3)',
    borderRadius: Radii.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dueBadgeText: { fontFamily: Typography.fontBodySemi, fontSize: 10, color: D.tertiaryContainer, letterSpacing: 0.3 },

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
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: Radii.full,
    paddingHorizontal: 10, paddingVertical: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
  },
  matchStar: { fontSize: 12, color: D.tertiaryFixedDim },
  matchText: { fontFamily: Typography.fontBodySemi, fontSize: 10, color: D.onSurface, letterSpacing: 0.5 },
  bookmarkBtn: {
    position: 'absolute', top: 16, right: 16,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  recommendedBody: { padding: 20, gap: Spacing.md },
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
    borderRadius: 24,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
    gap: Spacing.md,
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

  // ── Press feedback ─────────────────────────────────────────────────────────
  pressed: { opacity: 0.75 },
});
