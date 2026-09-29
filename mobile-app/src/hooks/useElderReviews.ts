import { useCallback, useEffect, useRef, useState } from 'react';
import { reviewsApi } from '../services/api/reviewsApi';
import { useAuthStore } from '../store/authStore';
import type { RatingSummary, Review } from '../types/review';

/**
 * The signed-in elder's own rating summary and reviews (Screen 11). Loaded
 * together so the summary block and the list never disagree, and reloadable
 * after a failure.
 */
export function useElderReviews() {
  const elderId = useAuthStore((state) => state.user?.userId);
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    if (!elderId) {
      setLoading(false);
      setLoadError(true);
      return;
    }
    setLoading(true);
    setLoadError(false);
    try {
      const [summaryResult, reviewsResult] = await Promise.all([
        reviewsApi.getSummary(elderId),
        reviewsApi.getReviews(elderId),
      ]);
      if (!mountedRef.current) return;
      setSummary({
        ratingCount: summaryResult.ratingCount,
        // BigDecimal can arrive as a string or a number depending on serialisation.
        averageRating: summaryResult.averageRating == null ? null : Number(summaryResult.averageRating),
      });
      setReviews(reviewsResult.content);
    } catch {
      if (mountedRef.current) setLoadError(true);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [elderId]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  return { summary, reviews, loading, loadError, reload: load };
}

export default useElderReviews;
