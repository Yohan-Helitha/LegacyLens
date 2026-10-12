import { useEffect, useState } from 'react';
import { trustScoreApi } from '../services/api/trustScoreApi';
import type { TrustScoreDetail } from '../types/trustScore';

/** Fetches the signed-in storyteller's Knowledge Keeper level once on mount. Screen 7 (Trust Score Detail). */
export function useTrustScore() {
  const [detail, setDetail] = useState<TrustScoreDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);

    trustScoreApi
      .getMine()
      .then((result) => {
        if (!cancelled) setDetail(result);
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

  return { detail, loading, loadError };
}

export default useTrustScore;
