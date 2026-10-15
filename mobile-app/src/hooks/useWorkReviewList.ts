import { useCallback, useEffect, useRef, useState } from 'react';
import { elderWorkReviewApi } from '../services/api/elderWorkReviewApi';
import type { WorkSubmissionSummary } from '../types/workReview';

/** The elder's queue of submitted work, grouped the way the Submitted Work screen shows it. */
export function useWorkReviewList() {
  const [items, setItems] = useState<WorkSubmissionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setLoadError(false);
    try {
      const result = await elderWorkReviewApi.list();
      if (mountedRef.current) setItems(result ?? []);
    } catch {
      if (mountedRef.current) setLoadError(true);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const awaiting = items.filter((item) => item.state === 'AWAITING_REVIEW');
  const changesRequested = items.filter((item) => item.state === 'CHANGES_REQUESTED');
  const approved = items.filter((item) => item.state === 'COMPLETED' || item.state === 'PUBLISHED');

  const refresh = useCallback(() => load('refresh'), [load]);
  const reload = useCallback(() => load('initial'), [load]);

  return { items, awaiting, changesRequested, approved, loading, refreshing, loadError, refresh, reload };
}

export default useWorkReviewList;
