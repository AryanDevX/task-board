import { apiFetch } from "./client";

export const notificationApi = {

  getNotifications: (projectId:string ) =>
    apiFetch(`/projects/${projectId}/notifications`),

  markAsRead: (notificationId: string, projectId:string ) =>
    apiFetch(`/projects/${projectId}/notifications/${notificationId}/read`, {
      method: "PUT"
    })
};