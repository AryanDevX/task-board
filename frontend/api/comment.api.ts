import { apiFetch } from "./client";

export const commentApi = {
  getComments: (taskId: string) =>
    apiFetch(`/tasks/${taskId}/comments`),

  createComment: (taskId: string, content: string) =>
    apiFetch(`/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content })
    }),

  updateComment: (commentId: string, content: string) =>
    apiFetch(`/comments/${commentId}`, {
      method: "PATCH",
      body: JSON.stringify({ content })
    }),

  deleteComment: (commentId: string) =>
    apiFetch(`/comments/${commentId}`, {
      method: "DELETE"
    })
};