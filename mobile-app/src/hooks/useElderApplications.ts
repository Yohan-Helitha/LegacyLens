import { useCallback, useEffect, useRef, useState } from 'react';
import { elderApplicationReviewApi } from '../services/api/opportunityApplicationApi';
import { messagingApi } from '../services/api/messagingApi';
import { ApiError } from '../services/api/client';
import type { OpportunityApplicationResponse } from '../types/opportunityApplication';

/**
 * The creators who applied to the signed-in elder's marketplace opportunities
 * (GET /api/elder/opportunity-applications), with accept / decline and "open
 * the chat". Deciding an application updates the list in place from the
 * response, and the backend tells the creator on their phone.
 */
export function useElderApplications() {
  const [applications, setApplications] = useState<OpportunityApplicationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setLoadError(false);
    try {
      const result = await elderApplicationReviewApi.list();
      if (mountedRef.current) setApplications(result ?? []);
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

  const decide = useCallback(async (applicationId: string, decision: 'approve' | 'reject'): Promise<boolean> => {
    setBusyId(applicationId);
    setActionError(null);
    try {
      const updated =
        decision === 'approve'
          ? await elderApplicationReviewApi.approve(applicationId)
          : await elderApplicationReviewApi.reject(applicationId);
      if (mountedRef.current) {
        setApplications((prev) => prev.map((item) => (item.id === applicationId ? { ...item, ...updated } : item)));
      }
      return true;
    } catch (err) {
      if (mountedRef.current) setActionError(err instanceof ApiError ? err.message : '');
      return false;
    } finally {
      if (mountedRef.current) setBusyId(null);
    }
  }, []);

  const approve = useCallback((applicationId: string) => decide(applicationId, 'approve'), [decide]);
  const reject = useCallback((applicationId: string) => decide(applicationId, 'reject'), [decide]);

  /**
   * Starts (or reopens) the chat with the creator behind an application. Resolves the conversation id,
   * or null if it couldn't be opened (see `actionError`).
   */
  const openChat = useCallback(async (application: OpportunityApplicationResponse): Promise<string | null> => {
    if (!application.creatorId) return null;
    setBusyId(application.id);
    setActionError(null);
    try {
      const conversation = await messagingApi.open(application.opportunityId, application.creatorId);
      return conversation.id;
    } catch (err) {
      if (mountedRef.current) setActionError(err instanceof ApiError ? err.message : '');
      return null;
    } finally {
      if (mountedRef.current) setBusyId(null);
    }
  }, []);

  const clearActionError = useCallback(() => setActionError(null), []);
  const refresh = useCallback(() => load('refresh'), [load]);
  const reload = useCallback(() => load('initial'), [load]);

  return { applications, loading, refreshing, loadError, busyId, actionError, approve, reject, openChat, clearActionError, refresh, reload };
}

export default useElderApplications;
