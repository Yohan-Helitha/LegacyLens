import { useCallback, useEffect, useRef, useState } from 'react';
import { creatorRecommendationApi } from '../services/api/creatorRecommendationApi';
import type { OpportunityRecommendations, RecommendedCreator } from '../types/creatorRecommendation';

/** BigDecimal ratings can arrive as strings — normalise so RatingStars always gets a number. */
const normaliseCreator = (creator: RecommendedCreator): RecommendedCreator => ({
  ...creator,
  rating: creator.rating == null ? null : Number(creator.rating),
  languages: creator.languages ?? [],
  reasons: creator.reasons ?? [],
});

/** Identifies one choose action — the same creator can be recommended for several opportunities. */
export const choiceKey = (opportunityId: string, creatorId: string) => `${opportunityId}:${creatorId}`;

/**
 * Recommended creators for each of the signed-in elder's open opportunities
 * (Content Creator Recommendation screen). `choose` resolves true once the
 * backend has recorded the choice; `chosen` remembers, per opportunity, who
 * was picked during this visit so that section can lock itself.
 */
export function useCreatorRecommendations() {
  const [sections, setSections] = useState<OpportunityRecommendations[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [actionErrorFor, setActionErrorFor] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Record<string, RecommendedCreator>>({});
  const mountedRef = useRef(true);

  const fetchSections = useCallback(async () => {
    const result = await creatorRecommendationApi.listMine();
    return (result ?? []).map((section) => ({
      opportunity: section.opportunity,
      bestMatch: section.bestMatch ? normaliseCreator(section.bestMatch) : null,
      others: (section.others ?? []).map(normaliseCreator),
    }));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const result = await fetchSections();
      if (mountedRef.current) setSections(result);
    } catch {
      if (mountedRef.current) setLoadError(true);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [fetchSections]);

  /** Pull-to-refresh — keeps the current list on screen if the refresh fails. */
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await fetchSections();
      if (mountedRef.current) {
        setSections(result);
        setLoadError(false);
      }
    } catch {
      // Keep showing what we already have.
    } finally {
      if (mountedRef.current) setRefreshing(false);
    }
  }, [fetchSections]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const choose = useCallback(async (opportunityId: string, creator: RecommendedCreator): Promise<boolean> => {
    setBusyKey(choiceKey(opportunityId, creator.creatorId));
    setActionErrorFor(null);
    try {
      await creatorRecommendationApi.chooseCreator(opportunityId, creator.creatorId);
      if (mountedRef.current) setChosen((prev) => ({ ...prev, [opportunityId]: creator }));
      return true;
    } catch {
      if (mountedRef.current) setActionErrorFor(opportunityId);
      return false;
    } finally {
      if (mountedRef.current) setBusyKey(null);
    }
  }, []);

  const clearActionError = useCallback(() => setActionErrorFor(null), []);

  return {
    sections,
    loading,
    refreshing,
    loadError,
    busyKey,
    actionErrorFor,
    chosen,
    choose,
    clearActionError,
    refresh,
    reload: load,
  };
}

export default useCreatorRecommendations;
