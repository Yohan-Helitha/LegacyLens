import { useCallback, useEffect, useState } from 'react';
import { storiesApi } from '../services/api/storiesApi';
import type { StoryResponse } from '../types/story';

/**
 * Fetches the signed-in storyteller's saved stories and exposes a
 * confirm-then-delete flow. Shared by the elder dashboard's "Your Stories"
 * preview and the full "Your Stories" page so both stay in sync with the
 * same loading/error/delete behaviour.
 */
export function useStoriesList() {
  const [stories, setStories] = useState<StoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(false);
    return storiesApi
      .listMine()
      .then(setStories)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const deleteStory = useCallback(async (storyId: string) => {
    setDeletingId(storyId);
    try {
      await storiesApi.remove(storyId);
      setStories((prev) => prev.filter((story) => story.id !== storyId));
    } finally {
      setDeletingId(null);
    }
  }, []);

  return { stories, loading, loadError, deletingId, deleteStory, reload: load };
}

export default useStoriesList;
