import { useCallback, useEffect, useState } from 'react';
import { elderWorkReviewApi } from '../services/api/elderWorkReviewApi';
import { usePushNotificationEvents } from './usePushNotifications';

/**
 * How many pieces of submitted work are waiting for the signed-in elder's review - the red number on the drawer's
 * "Submitted Work" and the dashboard's "Review now" card. It is the queue's own size from the backend, never
 * made up; if it cannot be loaded the number is simply 0. Reloads when `refreshKey` changes (e.g. the drawer
 * opening) and when a notification arrives, since new work is exactly what one is usually about.
 */
export function useAwaitingWorkCount(refreshKey: unknown = null): number {
  const [count, setCount] = useState(0);

  const load = useCallback(() => {
    elderWorkReviewApi
      .list()
      .then((items) => setCount((items ?? []).filter((item) => item.state === 'AWAITING_REVIEW').length))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  usePushNotificationEvents({ onReceived: load });

  return count;
}

export default useAwaitingWorkCount;
