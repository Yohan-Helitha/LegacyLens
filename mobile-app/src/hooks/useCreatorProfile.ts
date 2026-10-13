import { useCallback, useEffect, useRef, useState } from 'react';
import { creatorProfileApi } from '../services/api/creatorProfileApi';
import type { CreatorProfileData } from '../types/creatorProfile';

/**
 * The signed-in creator's own profile page, straight from the backend — every
 * section (details, skills, counts, previous work, private details) comes
 * from this one response.
 */
export function useCreatorProfile() {
  const [profile, setProfile] = useState<CreatorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const result = await creatorProfileApi.getMine();
      if (!mountedRef.current) return;
      setProfile({
        ...result,
        skills: result.skills ?? [],
        languages: result.languages ?? [],
        interests: result.interests ?? [],
        previousContributions: result.previousContributions ?? [],
      });
    } catch {
      if (mountedRef.current) setLoadError(true);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  return { profile, loading, loadError, reload: load };
}
