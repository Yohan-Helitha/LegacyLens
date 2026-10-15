import { useEffect, useState } from 'react';
import { storiesApi } from '../services/api/storiesApi';
import type { StorySummary } from '../types/story';

/**
 * The storyteller's newest stories (same row shape as My Stories), plus how many they have in total — for
 * the dashboard's "Your Stories" preview, which shows the same cards as My Stories. Fetched once on mount.
 */
export function useRecentStories(count: number) {
  const [stories, setStories] = useState<StorySummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);

    storiesApi
      .searchMine({ page: 0, size: count })
      .then((result) => {
        if (cancelled) return;
        setStories(result.content);
        setTotalCount(result.totalElements);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [count]);

  return { stories, totalCount, loading, loadError };
}

export default useRecentStories;
