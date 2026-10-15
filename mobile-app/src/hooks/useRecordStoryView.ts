import { useEffect } from 'react';
import { storiesApi } from '../services/api/storiesApi';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Counts a view of a story when a listener opens its detail screen. The home feed mixes real stories
 * (UUID ids) with curated feed items (numeric ids), and only stories have a view counter — so anything
 * that isn't a UUID is skipped. The backend debounces repeat opens (once per viewer per 24h) and ignores
 * the author's own views, so this can safely run on every open. Fire-and-forget: a failure never
 * affects the screen.
 */
export function useRecordStoryView(storyId: string | number | null | undefined) {
  useEffect(() => {
    if (storyId == null) return;
    const id = String(storyId);
    if (!UUID_PATTERN.test(id)) return;
    storiesApi.recordView(id).catch(() => {});
  }, [storyId]);
}

export default useRecordStoryView;
