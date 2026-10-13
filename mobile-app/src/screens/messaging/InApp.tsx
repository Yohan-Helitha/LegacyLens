import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Mic, MessageCircle } from 'lucide-react-native';
import { Avatar } from '../../components/common';
import { useConversations } from '../../hooks/useConversations';
import type { ConversationFilter, ConversationSummary } from '../../types/messaging';
import { formatConversationTime } from '../../utils/messageTime';
import { Typography, Spacing, Radii } from '../../theme';
import { messagingAvatarUri, MessagingColors as D } from './messagingTheme';

// ─────────────────────────────────────────────────────────────────────────────
// Props — the screen is shared by elders and creators. Each side supplies its
// own app bar and bottom navigation; everything in between is common.
// ─────────────────────────────────────────────────────────────────────────────
export interface InAppProps {
  /** The side's own app bar (creator: CreatorTopAppBar, elder: Header). */
  header?: React.ReactNode;
  /** The side's own bottom navigation (creator: BottomNavBar, elder: UserFooter). */
  footer?: React.ReactNode;
  /** True when `header` doesn't pad for the status bar itself (CreatorTopAppBar). The elder Header already does. */
  insetTop?: boolean;
  onOpenConversation: (conversationId: string) => void;
}

const FILTERS: { key: ConversationFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'UNREAD', label: 'Unread' },
  { key: 'COLLABORATIONS', label: 'Collaborations' },
];

// ─────────────────────────────────────────────────────────────────────────────
// SearchIcon
// ─────────────────────────────────────────────────────────────────────────────
const SearchIcon: React.FC = () => (
  <View style={s.searchIcon}>
    <View style={s.searchIconRing} />
    <View style={s.searchIconHandle} />
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// FilterBar
// ─────────────────────────────────────────────────────────────────────────────
const FilterBar: React.FC<{ active: ConversationFilter; onSelect: (k: ConversationFilter) => void }> = ({ active, onSelect }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
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
const ConversationCard: React.FC<{ item: ConversationSummary; onPress: () => void }> = ({ item, onPress }) => {
  const unread = item.unreadCount > 0;
  const name = item.otherParticipant.name;
  const isVoice = item.lastMessageType === 'VOICE_NOTE';
  // Before anyone has written, show what the chat is about instead of a blank line.
  const preview = item.lastMessagePreview
    ? `${item.lastMessageFromMe ? 'You: ' : ''}${item.lastMessagePreview}`
    : item.context?.title ?? 'Say hello';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.conversationCard, pressed && s.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${name}${unread ? `, ${item.unreadCount} unread` : ''}`}
    >
      <View style={s.avatarWrapper}>
        <Avatar uri={messagingAvatarUri(item.otherParticipant.avatarUrl)} size={52} />
        {unread && <View style={s.unreadDot} />}
      </View>

      <View style={s.conversationBody}>
        <View style={s.conversationHeaderRow}>
          <Text style={[s.conversationName, unread && s.conversationNameUnread]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={s.conversationTime}>{formatConversationTime(item.lastMessageAt)}</Text>
        </View>
        <View style={s.previewRow}>
          {isVoice && <Mic size={14} color={unread ? D.onSurface : D.onSurfaceVariant} strokeWidth={2} />}
          <Text style={[s.conversationPreview, unread && s.conversationPreviewUnread]} numberOfLines={1}>
            {preview}
          </Text>
          {unread && (
            <View style={s.unreadBadge}>
              <Text style={s.unreadBadgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Messages inbox — shared by elders and content creators. Conversations are
 * created by the backend when people start working together (a creator books
 * a job, an elder chooses or approves a creator), so there is no "new
 * message" button here.
 */
export const InApp: React.FC<InAppProps> = ({ header, footer, insetTop = false, onOpenConversation }) => {
  const [activeFilter, setActiveFilter] = useState<ConversationFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const { conversations, loading, refreshing, loadError, refresh, reload } = useConversations(activeFilter, searchQuery);

  const searching = searchQuery.trim().length > 0;

  return (
    <SafeAreaView style={s.safeArea} edges={insetTop ? (['top'] as const) : []}>
      <StatusBar style="dark" />

      {header}

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={D.primary} colors={[D.primary]} />}
      >
        <Text style={s.pageHeading} accessibilityRole="header">Messages</Text>

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

        {loading && conversations.length === 0 ? (
          <View style={s.stateBox}>
            <ActivityIndicator size="large" color={D.primary} accessibilityLabel="Loading messages" />
          </View>
        ) : loadError && conversations.length === 0 ? (
          <View style={s.stateBox}>
            <Text style={s.stateTitle}>Couldn't load your messages</Text>
            <Text style={s.stateText}>Check your connection and try again.</Text>
            <Pressable
              onPress={reload}
              style={({ pressed }) => [s.retryBtn, pressed && s.pressed]}
              accessibilityRole="button"
            >
              <Text style={s.retryBtnText}>Try again</Text>
            </Pressable>
          </View>
        ) : conversations.length > 0 ? (
          <View style={{ gap: Spacing.sm }}>
            {conversations.map((item) => (
              <ConversationCard key={item.id} item={item} onPress={() => onOpenConversation(item.id)} />
            ))}
          </View>
        ) : (
          <View style={s.stateBox}>
            <MessageCircle size={40} color={D.outlineVariant} strokeWidth={1.5} />
            <Text style={s.stateTitle}>
              {searching || activeFilter !== 'ALL' ? 'No conversations match.' : 'No messages yet'}
            </Text>
            {!searching && activeFilter === 'ALL' && (
              <Text style={s.stateText}>
                A conversation starts when you begin working with someone — after a booking or when a creator is chosen.
              </Text>
            )}
          </View>
        )}

        <View style={{ height: Spacing.lg }} />
      </ScrollView>

      {footer}
    </SafeAreaView>
  );
};

export default InApp;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },

  scroll: { flex: 1 },
  scrollContent: { paddingTop: Spacing.md, paddingHorizontal: Spacing.md, gap: Spacing.md },

  pageHeading: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXL,
    lineHeight: 32,
    color: D.onSurface,
    letterSpacing: -0.2,
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
  searchIcon: { width: 16, height: 16, marginRight: Spacing.sm },
  searchIconRing: { width: 11, height: 11, borderRadius: 6, borderWidth: 1.6, borderColor: D.primary },
  searchIconHandle: {
    position: 'absolute', right: 0, bottom: 0,
    width: 6, height: 1.6, borderRadius: 1,
    backgroundColor: D.primary,
    transform: [{ rotate: '45deg' }],
  },
  searchInput: { flex: 1, fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurface, paddingVertical: 12 },

  // ── Filters ────────────────────────────────────────────────────────────────
  filterRow: { flexDirection: 'row', gap: Spacing.sm, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: Radii.lg, minHeight: 40, justifyContent: 'center' },
  filterChipActive: { backgroundColor: D.primary },
  filterChipInactive: { backgroundColor: D.surfaceContainerLowest, borderWidth: StyleSheet.hairlineWidth, borderColor: D.outlineVariant },
  filterChipText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurfaceVariant, letterSpacing: 0.4 },
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
  unreadDot: {
    position: 'absolute', top: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: D.secondary,
    borderWidth: 2, borderColor: D.surfaceContainerLowest,
  },
  conversationBody: { flex: 1, gap: 3 },
  conversationHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: Spacing.sm },
  conversationName: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeMD, color: D.onSurface, flexShrink: 1 },
  conversationNameUnread: { fontFamily: Typography.fontBodySemi },
  conversationTime: { fontFamily: Typography.fontBody, fontSize: 12, color: D.onSurfaceVariant, flexShrink: 0 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  conversationPreview: { flex: 1, fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },
  conversationPreviewUnread: { fontFamily: Typography.fontBodyMed, color: D.onSurface },
  unreadBadge: {
    minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6,
    backgroundColor: D.secondary, alignItems: 'center', justifyContent: 'center',
  },
  unreadBadgeText: { fontFamily: Typography.fontBodySemi, fontSize: 12, color: '#ffffff' },

  // ── Loading / error / empty ────────────────────────────────────────────────
  stateBox: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl, paddingHorizontal: Spacing.md },
  stateTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.onSurface, textAlign: 'center' },
  stateText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 21, color: D.onSurfaceVariant, textAlign: 'center' },
  retryBtn: { marginTop: Spacing.sm, backgroundColor: D.primary, borderRadius: Radii.lg, paddingHorizontal: Spacing.lg, minHeight: 44, justifyContent: 'center' },
  retryBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ffffff' },

  pressed: { opacity: 0.75 },
});
