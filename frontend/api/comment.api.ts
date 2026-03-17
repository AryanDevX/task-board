import { apiFetch } from './client';

export const commentApi = {
  getComments: (taskId: string) =>
    apiFetch(`/api/projects/:projectId/tasks/${taskId}/comments`),

  createComment: (taskId: string, content: string) =>
    apiFetch(`/api/projects/:projectId/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  updateComment: (commentId: string, content: string, taskId: string) =>
    apiFetch(`/api/projects/:projectId/tasks/${taskId}/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),

  deleteComment: (commentId: string, taskId: string) =>
    apiFetch(`/api/projects/:projectId/tasks/${taskId}/comments/${commentId}`, {
      method: 'DELETE',
    }),
};
