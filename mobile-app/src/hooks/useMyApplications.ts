import { useCallback, useEffect, useState } from 'react';
import { opportunityApplicationApi } from '../services/api/opportunityApplicationApi';
import { ApiError } from '../services/api/client';
import type { OpportunityApplicationResponse } from '../types/opportunityApplication';

/**
 * The signed-in creator's applications, straight from the server. Nothing is kept on the phone, so
 * every status shown is the server's. `error` is set when the load fails, so a failure never reads
 * as "nothing here".
 */
export function useMyApplications() {
  const [applications, setApplications] = useState<OpportunityApplicationResponse[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    return opportunityApplicationApi
      .getMyApplications()
      .then((list) => {
        setApplications(list);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Could not load your applications.');
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { applications, loaded, error, reload };
}
