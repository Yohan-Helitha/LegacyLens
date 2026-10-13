import { useCallback, useEffect, useRef, useState } from 'react';
import { messagingApi } from '../services/api/messagingApi';
import type { ConversationFilter, ConversationSummary } from '../types/messaging';

/** Wait this long after the last keystroke before searching, so typing doesn't fire a request per letter. */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * The signed-in user's inbox (shared InApp screen) — works the same for
 * elders and creators. Reloads whenever the filter or (debounced) search
 * changes; `refresh` is for pull-to-refresh and keeps the list on screen.
 */
export function useConversations(filter: ConversationFilter, search: string) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const mountedRef = useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const result = await messagingApi.list(filter, debouncedSearch);
      if (mountedRef.current) setConversations(result ?? []);
    } catch {
      if (mountedRef.current) setLoadError(true);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [filter, debouncedSearch]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await messagingApi.list(filter, debouncedSearch);
      if (mountedRef.current) {
        setConversations(result ?? []);
        setLoadError(false);
      }
    } catch {
      // Keep what's already on screen.
    } finally {
      if (mountedRef.current) setRefreshing(false);
    }
  }, [filter, debouncedSearch]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const totalUnread = conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0);

  return { conversations, totalUnread, loading, refreshing, loadError, refresh, reload: load };
}

export default useConversations;
