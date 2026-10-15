import { useEffect, useState } from 'react';
import { storiesApi } from '../services/api/storiesApi';
import type { AnalyticsSummary } from '../types/story';

/** Fetches the dashboard analytics card's numbers once on mount (the dashboard remounts on each visit). */
export function useAnalyticsSummary() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);

    storiesApi
      .getAnalyticsSummary()
      .then((result) => {
        if (!cancelled) setSummary(result);
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
  }, []);

  return { summary, loading, loadError };
}

export default useAnalyticsSummary;
