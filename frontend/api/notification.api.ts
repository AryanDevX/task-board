import { apiFetch } from "./client";

export const notificationApi = {

  getNotifications: () =>
    apiFetch("/notifications"),

  markAsRead: (notificationId: string) =>
    apiFetch(`/notifications/${notificationId}/read`, {
      method: "POST"
    })
};