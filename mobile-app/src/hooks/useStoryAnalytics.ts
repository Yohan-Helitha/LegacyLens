import { useEffect, useState } from 'react';
import { storiesApi } from '../services/api/storiesApi';
import type { StoryAnalytics } from '../types/story';

/** Fetches one published story's analytics (views, likes, reviews, 7-day chart) for the story analytics screen. */
export function useStoryAnalytics(storyId: string | undefined) {
  const [analytics, setAnalytics] = useState<StoryAnalytics | null>(null);
  const [loading, setLoading] = useState(!!storyId);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!storyId) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(false);

    storiesApi
      .getAnalytics(storyId)
      .then((result) => {
        if (!cancelled) setAnalytics(result);
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
  }, [storyId]);

  return { analytics, loading, loadError };
}

export default useStoryAnalytics;
