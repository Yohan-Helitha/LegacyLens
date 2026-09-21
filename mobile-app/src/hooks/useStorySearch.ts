import { useCallback, useEffect, useRef, useState } from 'react';
import { storiesApi } from '../services/api/storiesApi';
import type { StorySummary } from '../types/story';

const SEARCH_DEBOUNCE_MS = 350;
/** Generous single page — this screen deliberately has no "load more"/pagination UI. */
const PAGE_SIZE = 50;

/**
 * Debounced search over the signed-in storyteller's own stories (Screen 6,
 * My Stories). Typing and voice search both just set `query` — same code
 * path either way, so a spoken result behaves exactly like a typed one.
 */
export function useStorySearch() {
  const [query, setQuery] = useState('');
  const [stories, setStories] = useState<StorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  /** The unfiltered total — only updated on an empty-query load, so it doesn't flicker while searching. */
  const [totalCount, setTotalCount] = useState(0);
  const requestIdRef = useRef(0);

  const runSearch = useCallback((searchTerm: string) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setLoadError(false);

    storiesApi
      .searchMine({ search: searchTerm, page: 0, size: PAGE_SIZE })
      .then((result) => {
        // Ignore stale responses from a search that's since been superseded.
        if (requestId !== requestIdRef.current) return;
        setStories(result.content);
        if (!searchTerm.trim()) {
          setTotalCount(result.totalElements);
        }
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setLoadError(true);
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => runSearch(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query, runSearch]);

  const removeStory = useCallback((storyId: string) => {
    setStories((prev) => prev.filter((story) => story.id !== storyId));
  }, []);

  return { query, setQuery, stories, loading, loadError, totalCount, removeStory, reload: () => runSearch(query) };
}

export default useStorySearch;
