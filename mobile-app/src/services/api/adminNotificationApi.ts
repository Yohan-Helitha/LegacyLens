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
    const response = await apiClient.get('/admin/notifications');
    const data = response.data;
    const notifications = Array.isArray(data) ? data : (data?.data ?? []);
    
    return notifications.map((n: any) => ({
      ...n,
      read: n.read ?? n.isRead ?? false
    }));
  },

  markAsRead: async (type: string, id: string): Promise<void> => {
    await apiClient.put(`/admin/notifications/${type}/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.put('/admin/notifications/read-all');
  }
};
