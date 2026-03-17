import { apiFetch } from './client';
import { type Notification } from '../types/models';

export const notificationApi = {
  // Get all notifications for current user
  getNotifications: (projectId: string): Promise<Notification[]> =>
    apiFetch(`/projects/${projectId}/notifications`),

  // Mark a single notification as read
  markAsRead: (
    notificationId: string,
    projectId: string,
  ): Promise<Notification> =>
    apiFetch(`/projects/${projectId}/notifications/${notificationId}/read`, {
      method: 'PUT',
    }),
};
