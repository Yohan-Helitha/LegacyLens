import { useCallback, useEffect, useRef, useState } from 'react';
import { hireRequestApi } from '../services/api/hireRequestApi';
import type { JobApplicationSummary } from '../types/hireRequest';

/**
 * Applicants for one hire request (Screen 10). Choosing a creator and
 * declining one both update the list optimistically-after-success, so cards
 * flip to their "Not selected" state only once the backend has accepted it.
 */
export function useJobApplicants(jobRequestId: string) {
  const [applicants, setApplicants] = useState<JobApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const result = await hireRequestApi.getApplications(jobRequestId);
      if (!mountedRef.current) return;
      setApplicants(
        result.map((application) => ({
          ...application,
          creatorRating: application.creatorRating == null ? null : Number(application.creatorRating),
        })),
      );
    } catch {
      if (mountedRef.current) setLoadError(true);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [jobRequestId]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  /**
   * Accepts one applicant. The backend auto-rejects everyone else still
   * pending, so mirror that locally. Resolves true on success.
   */
  const choose = useCallback(
    async (applicationId: string): Promise<boolean> => {
      setBusyId(applicationId);
      setActionError(false);
      try {
        await hireRequestApi.approveApplication(jobRequestId, applicationId);
        if (!mountedRef.current) return true;
        setApplicants((prev) =>
          prev.map((application) => {
            if (application.id === applicationId) return { ...application, status: 'ACCEPTED' };
            return application.status === 'PENDING' ? { ...application, status: 'REJECTED' } : application;
          }),
        );
        return true;
      } catch {
        if (mountedRef.current) setActionError(true);
        return false;
      } finally {
        if (mountedRef.current) setBusyId(null);
      }
    },
    [jobRequestId],
  );

  /** Declines one applicant. `reason` is optional — omit it to skip the note entirely. */
  const decline = useCallback(
    async (applicationId: string, reason?: string): Promise<boolean> => {
      setBusyId(applicationId);
      setActionError(false);
      try {
        await hireRequestApi.rejectApplication(jobRequestId, applicationId, reason?.trim() || undefined);
        if (!mountedRef.current) return true;
        setApplicants((prev) =>
          prev.map((application) =>
            application.id === applicationId ? { ...application, status: 'REJECTED' } : application,
          ),
        );
        return true;
      } catch {
        if (mountedRef.current) setActionError(true);
        return false;
      } finally {
        if (mountedRef.current) setBusyId(null);
      }
    },
    [jobRequestId],
  );

  const pendingCount = applicants.filter((application) => application.status === 'PENDING').length;

  const clearActionError = useCallback(() => setActionError(false), []);

  return {
    applicants,
    loading,
    loadError,
    busyId,
    actionError,
    pendingCount,
    choose,
    decline,
    clearActionError,
    reload: load,
  };
}

export default useJobApplicants;
