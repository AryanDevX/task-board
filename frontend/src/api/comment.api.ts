import { apiFetch } from './client';
import { type Comment } from '../types/models';

export const commentApi = {
  // Get all comments for a task
  getCommentsByTask: (taskId: string, projectId: string): Promise<Comment[]> =>
    apiFetch(`projects/${projectId}/tasks/${taskId}/comments`),

  // Create a comment
  createComment: (
    taskId: string,
    projectId: string,
    data: {
      content: string;
    },
  ): Promise<Comment> =>
    apiFetch(`projects/${projectId}/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update a comment
  updateComment: (
    commentId: string,
    projectId: string,
    taskId: string,
    data: {
      content: string;
    },
  ): Promise<Comment> =>
    apiFetch(`projects/${projectId}/tasks/${taskId}/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete a comment
  deleteComment: (
    commentId: string,
    taskId: string,
    projectId: string,
  ): Promise<void> =>
    apiFetch(`projects/${projectId}/tasks/${taskId}/comments/${commentId}`, {
      method: 'DELETE',
    }),
};
