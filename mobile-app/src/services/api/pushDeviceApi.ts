import axios from 'axios';
import { apiPost } from './client';
import { getApiBaseUrl } from '../../constants/api';

/** Typed wrappers around /api/notifications/devices - tells the server where to send this phone's notifications. */
export const pushDeviceApi = {
  register: (token: string, platform: string) =>
    apiPost<void, { token: string; platform: string }>('/notifications/devices', { token, platform }),

  /**
   * Removes a phone. Takes the session token explicitly because this runs at log-out, when the app no
   * longer has one of its own - so it bypasses the usual client, which would send no login.
   */
  unregister: async (pushToken: string, sessionToken: string): Promise<void> => {
    await axios.delete(`${getApiBaseUrl()}/notifications/devices`, {
      params: { token: pushToken },
      headers: { Authorization: `Bearer ${sessionToken}` },
      timeout: 10000,
    });
  },
};
