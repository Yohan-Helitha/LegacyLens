import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BookOpen, Plus } from 'lucide-react-native';
import { Header, UserFooter } from '../../components/common';
import type { UserTabKey } from '../../components/common';
import {
  ElderNavDrawer,
  StoryHeroCard,
  StoryListCard,
  VoiceSearchBar,
  ContentCaptureColors as D,
} from '../../components/module-specific/content-capture';
import type { ElderDrawerItem } from '../../components/module-specific/content-capture';
import { useStorySearch } from '../../hooks/useStorySearch';
import { useAuthStore } from '../../store/authStore';
import type { StoryStatus, StorySummary } from '../../types/story';
import { Typography, Spacing, Radii } from '../../theme';

interface YourStoriesProps {
  onTabPress?: (tab: UserTabKey) => void;
  onOpenStory?: (storyId: string, status: StoryStatus) => void;
  /** A published story opens its analytics (views, likes, reviews) instead of the read-only form. */
  onOpenPublishedStory?: (storyId: string) => void;
  /** Which tab to show first — the navigator remembers it, since leaving for a story's analytics unmounts this screen. */
  initialTab?: StoriesTab;
  onTabChange?: (tab: StoriesTab) => void;
  onNewStory?: () => void;
  onDrawerNavigate?: (item: ElderDrawerItem) => void;
  onLogout?: () => void;
}

export type StoriesTab = 'inProgress' | 'published';

const TabButton: React.FC<{ label: string; count: number; selected: boolean; onPress: () => void }> = ({
  label,
  count,
  selected,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [s.tab, selected && s.tabSelected, pressed && s.pressedLight]}
    accessibilityRole="tab"
    accessibilityState={{ selected }}
    accessibilityLabel={`${label}, ${count} ${count === 1 ? 'story' : 'stories'}`}
  >
    <Text style={[s.tabText, selected && s.tabTextSelected]}>{label}</Text>
    <View style={[s.tabCount, selected && s.tabCountSelected]}>
      <Text style={[s.tabCountText, selected && s.tabCountTextSelected]}>{count}</Text>
    </View>
  </Pressable>
);

/**
 * The full personal record of everything the storyteller has saved — a
 * warm, browsable archive rather than a plain file list. Reached from the
 * dashboard's "View All" and the side drawer's "My Stories" item.
 *
 * Deliberately minimal interaction surface: search (type or speak), tap a
 * card to open it, and "+ New Story". No filters, sort menus, or per-card
 * actions — those live on the story's own detail screen instead.
 */
export const YourStories: React.FC<YourStoriesProps> = ({
  onTabPress,
  onOpenStory,
  onOpenPublishedStory,
  initialTab = 'inProgress',
  onTabChange,
  onNewStory,
  onDrawerNavigate,
  onLogout,
}) => {
  const [drawerVisible, setDrawerVisible] = React.useState(false);
  const [tab, setTab] = React.useState<StoriesTab>(initialTab);
  const selectTab = (next: StoriesTab) => {
    setTab(next);
    onTabChange?.(next);
  };
  const insets = useSafeAreaInsets();
  const { query, setQuery, stories, loading, loadError, totalCount } = useStorySearch();
  const firstName = useAuthStore((state) => state.user?.fullName.split(' ')[0]) ?? 'there';

  const isSearching = query.trim().length > 0;
  // A story moves to the Published tab the moment its status becomes PUBLISHED.
  const publishedStories = stories.filter((story) => story.status === 'PUBLISHED');
  const inProgressStories = stories.filter((story) => story.status !== 'PUBLISHED');
  const visibleStories = tab === 'published' ? publishedStories : inProgressStories;
  const [hero, ...rest] = visibleStories;
  const openStory = (story: StorySummary) =>
    story.status === 'PUBLISHED' ? onOpenPublishedStory?.(story.id) : onOpenStory?.(story.id, story.status);

  const showEmptyState = !loading && !loadError && stories.length === 0 && !isSearching;
  const showNoSearchResults = !loading && !loadError && stories.length === 0 && isSearching;
  const showEmptyTab = !loading && !loadError && stories.length > 0 && visibleStories.length === 0;

  return (
    <View style={s.safeArea}>
      <StatusBar style="dark" />

      <Header title="My Stories" onMenuPress={() => setDrawerVisible(true)} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.greeting}>
          <Text style={s.greetingTitle}>Your Stories, {firstName}</Text>
          {totalCount > 0 && (
            <Text style={s.greetingSubtitle}>
              {totalCount} {totalCount === 1 ? 'story' : 'stories'} shared · loved by your family and community
            </Text>
          )}
        </View>

        <VoiceSearchBar value={query} onChangeText={setQuery} />

        <View style={s.tabBar} accessibilityRole="tablist">
          <TabButton
            label="In progress"
            count={inProgressStories.length}
            selected={tab === 'inProgress'}
            onPress={() => selectTab('inProgress')}
          />
          <TabButton
            label="Published"
            count={publishedStories.length}
            selected={tab === 'published'}
            onPress={() => selectTab('published')}
          />
        </View>

        {loadError && (
          <View style={s.emptyState}>
            <View style={s.emptyIconWrap}>
              <BookOpen size={32} color={D.onSecondaryContainer} strokeWidth={2} />
            </View>
            <Text style={s.emptyTitle}>Couldn't load your stories</Text>
            <Text style={s.emptyText}>Check your connection and try again.</Text>
          </View>
        )}

        {showNoSearchResults && (
          <View style={s.noResults}>
            <Text style={s.noResultsText}>No stories match "{query.trim()}".</Text>
          </View>
        )}

        {showEmptyState && (
          <View style={s.emptyState}>
            <View style={s.emptyIconWrap}>
              <BookOpen size={32} color={D.onSecondaryContainer} strokeWidth={2} />
            </View>
            <Text style={s.emptyTitle}>Your stories will appear here once you share one</Text>
            <Text style={s.emptyText}>
              Every memory you record or write becomes part of your family's story.
            </Text>
            <Pressable
              onPress={onNewStory}
              style={({ pressed }) => [s.emptyStateBtn, pressed && s.pressedLight]}
              accessibilityRole="button"
            >
              <Plus size={18} color={D.onPrimary} strokeWidth={2.5} />
              <Text style={s.emptyStateBtnText}>New Story</Text>
            </Pressable>
          </View>
        )}

        {showEmptyTab && (
          <View style={s.noResults}>
            <Text style={s.noResultsText}>
              {tab === 'published'
                ? 'No published stories yet. Once a story is approved, it will appear here with its views, likes and reviews.'
                : 'Nothing in progress right now.'}
            </Text>
          </View>
        )}

        {!!hero && <StoryHeroCard story={hero as StorySummary} onPress={() => openStory(hero)} />}

        {rest.length > 0 && (
          <View style={{ gap: Spacing.sm }}>
            {rest.map((story) => (
              <StoryListCard key={story.id} story={story} onPress={() => openStory(story)} />
            ))}
          </View>
        )}
      </ScrollView>

      {stories.length > 0 && (
        <Pressable
          onPress={onNewStory}
          style={({ pressed }) => [
            s.fab,
            // See MyHireRequestsScreen's matching FAB for why this isn't a
            // hardcoded bottom: UserFooter's own safe-area inset varies by
            // device, and a fixed guess undershot it on a tall gesture bar.
            { bottom: 64 + insets.bottom + Spacing.md },
            pressed && s.pressedLight,
          ]}
          accessibilityRole="button"
          accessibilityLabel="New Story"
        >
          <Plus size={22} color={D.onPrimary} strokeWidth={2.5} />
          <Text style={s.fabText}>New Story</Text>
        </Pressable>
      )}

      <UserFooter activeTab="home" onTabSelect={(tab) => onTabPress?.(tab)} />

      <ElderNavDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        activeItem="stories"
        requestsCount={1}
        onNavigate={onDrawerNavigate}
        onLogout={onLogout}
      />
    </View>
  );
};

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },

  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl + Spacing.lg,
    gap: Spacing.md,
  },

  greeting: { gap: 4, marginBottom: Spacing.xs },
  greetingTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size2XL,
    color: D.onSurface,
  },
  greetingSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
  },

  tabBar: {
    flexDirection: 'row',
    gap: Spacing.xs,
    padding: 4,
    backgroundColor: D.surfaceContainerLow,
    borderRadius: Radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    borderRadius: Radii.full,
  },
  tabSelected: { backgroundColor: D.primaryContainer },
  tabText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },
  tabTextSelected: { color: D.onPrimary },
  tabCount: {
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.full,
    backgroundColor: D.surfaceVariant,
    alignItems: 'center',
  },
  tabCountSelected: { backgroundColor: D.secondaryContainer },
  tabCountText: { fontFamily: Typography.fontBodySemi, fontSize: 12, color: D.onSurfaceVariant },
  tabCountTextSelected: { color: D.onSecondaryContainer },

  noResults: { paddingVertical: Spacing.lg, alignItems: 'center' },
  noResultsText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
  },

  emptyState: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radii.full,
    backgroundColor: D.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG,
    color: D.onSurface,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
    textAlign: 'center',
  },
  emptyStateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: D.primary,
    borderRadius: Radii.full,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  emptyStateBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.onPrimary },

  fab: {
    position: 'absolute',
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: D.primary,
    borderRadius: Radii.full,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  fabText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onPrimary },

  pressedLight: { opacity: 0.88 },
});

export default YourStories;
