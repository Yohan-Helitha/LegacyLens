import { apiClient } from './client';

export interface AdminNotificationResponse {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  createdAt: string;
  type: 'opportunity' | 'moderation';
  read: boolean;
}

export const adminNotificationApi = {
  getNotifications: async (): Promise<AdminNotificationResponse[]> => {
    const response = await apiClient.get('/api/admin/notifications');
    return response.data;
  },

  markAsRead: async (type: string, id: string): Promise<void> => {
    await apiClient.put(`/api/admin/notifications/${type}/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.put('/api/admin/notifications/read-all');
  }
};
