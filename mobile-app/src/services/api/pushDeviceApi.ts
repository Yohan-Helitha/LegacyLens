import { apiDelete, apiPost } from './client';

/** Typed wrappers around /api/notifications/devices - tells the server where to send this phone's notifications. */
export const pushDeviceApi = {
  register: (token: string, platform: string) =>
    apiPost<void, { token: string; platform: string }>('/notifications/devices', { token, platform }),

  unregister: (token: string) => apiDelete<void>(`/notifications/devices?token=${encodeURIComponent(token)}`),
};
