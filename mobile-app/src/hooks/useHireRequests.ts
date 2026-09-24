import { useCallback, useEffect, useRef, useState } from 'react';
import { hireRequestApi } from '../services/api/hireRequestApi';
import { toHireDisplayStatus } from '../utils/hireRequest';
import type {
  AssignedCreator,
  HireDisplayStatus,
  JobRequestSummary,
} from '../types/hireRequest';

export interface HireRequestItem extends JobRequestSummary {
  displayStatus: HireDisplayStatus;
  /** Only resolved for ASSIGNED/COMPLETED requests; null while loading or if it couldn't be fetched. */
  assignedCreator: AssignedCreator | null;
}

/** Looks up the ACCEPTED application for a closed request — the backend summary doesn't carry the chosen creator. */
async function fetchAssignedCreator(jobRequestId: string): Promise<AssignedCreator | null> {
  const applications = await hireRequestApi.getApplications(jobRequestId);
  const accepted = applications.find((application) => application.status === 'ACCEPTED');
  if (!accepted) return null;
  return {
    creatorId: accepted.creatorId,
    name: accepted.creatorName,
    rating: accepted.creatorRating == null ? null : Number(accepted.creatorRating),
  };
}

/**
 * Loads the elder's posted hire requests (Screen 9, My Requests) and maps
 * each onto its display status. Assigned creators are resolved in a second
 * pass so the list itself renders as soon as the first request returns.
 */
export function useHireRequests() {
  const [requests, setRequests] = useState<HireRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const requestIdRef = useRef(0);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    const requestId = ++requestIdRef.current;
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setLoadError(false);

    try {
      const summaries = await hireRequestApi.listMine();
      if (requestId !== requestIdRef.current) return;

      const items = summaries.flatMap((summary): HireRequestItem[] => {
        const displayStatus = toHireDisplayStatus(summary.status, summary.applicantCount);
        return displayStatus ? [{ ...summary, displayStatus, assignedCreator: null }] : [];
      });
      setRequests(items);

      const assigned = items.filter((item) => item.displayStatus === 'ASSIGNED');
      const resolved = await Promise.allSettled(assigned.map((item) => fetchAssignedCreator(item.id)));
      if (requestId !== requestIdRef.current) return;

      const creatorByRequest = new Map<string, AssignedCreator>();
      resolved.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          creatorByRequest.set(assigned[index].id, result.value);
        }
      });
      if (creatorByRequest.size > 0) {
        setRequests((prev) =>
          prev.map((item) => ({ ...item, assignedCreator: creatorByRequest.get(item.id) ?? item.assignedCreator })),
        );
      }
    } catch {
      if (requestId !== requestIdRef.current) return;
      setLoadError(true);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    load();
    return () => {
      // Invalidate any in-flight load so it can't set state after unmount.
      requestIdRef.current += 1;
    };
  }, [load]);

  const refresh = useCallback(() => load('refresh'), [load]);
  const reload = useCallback(() => load('initial'), [load]);

  return { requests, loading, refreshing, loadError, refresh, reload };
}

export default useHireRequests;
