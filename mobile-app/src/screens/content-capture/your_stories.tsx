import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BookOpen } from 'lucide-react-native';
import { ConfirmDialog, Header, UserFooter } from '../../components/common';
import type { UserTabKey } from '../../components/common';
import {
  ElderNavDrawer,
  StoryCard,
  toStoryCardItem,
  ContentCaptureColors as D,
} from '../../components/module-specific/content-capture';
import type { ElderDrawerItem } from '../../components/module-specific/content-capture';
import { useStoriesList } from '../../hooks/useStoriesList';
import type { StoryResponse } from '../../types/story';
import { Typography, Spacing } from '../../theme';

interface YourStoriesProps {
  onTabPress?: (tab: UserTabKey) => void;
  onReviewStory?: (story: StoryResponse) => void;
  onDrawerNavigate?: (item: ElderDrawerItem) => void;
  onLogout?: () => void;
}

/**
 * Full list of everything the storyteller has saved so far — reached from
 * the dashboard's "View All" and the side drawer's "My Stories" item.
 * Nothing publishes yet, so most rows read "Pending"; they're saved here
 * for future editing, not lost. Shares the same Header/drawer/footer chrome
 * as the dashboard so it reads as a peer nav destination, not a sub-screen.
 */
export const YourStories: React.FC<YourStoriesProps> = ({
  onTabPress,
  onReviewStory,
  onDrawerNavigate,
  onLogout,
}) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { stories, loading, loadError, deletingId, deleteStory } = useStoriesList();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    await deleteStory(deleteTargetId);
    setDeleteTargetId(null);
  };

  return (
    <View style={s.safeArea}>
      <StatusBar style="dark" />

      <Header title="Your Stories" onMenuPress={() => setDrawerVisible(true)} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!loading && loadError && (
          <View style={s.emptyState}>
            <BookOpen size={28} color={D.onSurfaceVariant} strokeWidth={2} />
            <Text style={s.emptyTitle}>Couldn't load your stories</Text>
            <Text style={s.emptyText}>Check your connection and try again.</Text>
          </View>
        )}

        {!loading && !loadError && stories.length === 0 && (
          <View style={s.emptyState}>
            <BookOpen size={28} color={D.onSurfaceVariant} strokeWidth={2} />
            <Text style={s.emptyTitle}>No stories yet</Text>
            <Text style={s.emptyText}>Record or upload your first story from the dashboard.</Text>
          </View>
        )}

        <View style={{ gap: Spacing.sm }}>
          {stories.map((story) => (
            <StoryCard
              key={story.id}
              story={toStoryCardItem(story)}
              onReview={() => onReviewStory?.(story)}
              onDelete={() => setDeleteTargetId(story.id)}
            />
          ))}
        </View>
      </ScrollView>

      <UserFooter activeTab="home" onTabSelect={(tab) => onTabPress?.(tab)} />

      <ElderNavDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        activeItem="stories"
        requestsCount={1}
        onNavigate={onDrawerNavigate}
        onLogout={onLogout}
      />

      <ConfirmDialog
        visible={!!deleteTargetId}
        title="Delete this story?"
        message="This can't be undone — the recording and details will be permanently removed."
        confirmLabel={deletingId ? 'Deleting…' : 'Delete'}
        cancelLabel="Cancel"
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
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
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },

  emptyState: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: D.onSurface,
  },
  emptyText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
    textAlign: 'center',
  },
});

export default YourStories;
