import { useCallback, useEffect, useRef, useState } from 'react';
import { elderWorkReviewApi } from '../services/api/elderWorkReviewApi';
import { ApiError } from '../services/api/client';
import type { CreatorReview, WorkSubmissionDetail } from '../types/workReview';

/** What a reviewer's API must offer; the admin's has `publish` instead of rating. */
export interface WorkReviewSource {
  get: (jobId: string) => Promise<WorkSubmissionDetail>;
  approve: (jobId: string) => Promise<unknown>;
  decline: (jobId: string, message: string) => Promise<unknown>;
  getRating?: (jobId: string) => Promise<CreatorReview | null>;
  rate?: (jobId: string, rating: number, comment?: string) => Promise<unknown>;
  publish?: (jobId: string) => Promise<unknown>;
}

/** The server's own message when it gave one, otherwise empty so the screen can show its translated default. */
const messageOf = (err: unknown) => (err instanceof ApiError ? err.message : '');

export interface ActionResult {
  ok: boolean;
  /** The server's message on failure; empty when it gave none. */
  error: string;
}

/**
 * One submitted job for the elder: its content, approve / decline-with-a-reason, and rating the creator
 * once it is completed. Every action reloads the job so the screen always shows what the server says.
 */
export function useWorkSubmission(jobId: string, api: WorkReviewSource = elderWorkReviewApi) {
  const [detail, setDetail] = useState<WorkSubmissionDetail | null>(null);
  const [rating, setRating] = useState<CreatorReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const result = await api.get(jobId);
      if (!mountedRef.current) return;
      setDetail(result);
      const done = result.summary.state === 'COMPLETED' || result.summary.state === 'PUBLISHED';
      // A job that was already rated must show that rating, not an empty form.
      setRating(done && api.getRating ? await api.getRating(jobId).catch(() => null) : null);
    } catch (err) {
      if (mountedRef.current) setLoadError(messageOf(err) || 'error');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [jobId, api]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const run = useCallback(
    async (action: () => Promise<unknown>): Promise<ActionResult> => {
      setBusy(true);
      try {
        await action();
        if (mountedRef.current) await load();
        return { ok: true, error: '' };
      } catch (err) {
        return { ok: false, error: messageOf(err) };
      } finally {
        if (mountedRef.current) setBusy(false);
      }
    },
    [load],
  );

  const approve = useCallback(() => run(() => api.approve(jobId)), [run, api, jobId]);
  const decline = useCallback(
    (message: string) => run(() => api.decline(jobId, message.trim())),
    [run, api, jobId],
  );
  const rate = useCallback(
    (stars: number, comment: string) => run(() => (api.rate ? api.rate(jobId, stars, comment) : Promise.resolve())),
    [run, api, jobId],
  );
  const publish = useCallback(() => run(() => (api.publish ? api.publish(jobId) : Promise.resolve())), [run, api, jobId]);

  return { detail, rating, loading, loadError, busy, approve, decline, rate, publish, reload: load };
}

export default useWorkSubmission;
