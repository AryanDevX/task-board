import { apiFetch } from './client';

export const taskApi = {
  getTasks: (projectId: string, columnId: string, boardId: string) =>
    apiFetch(
      `/projects/${projectId}/board/${boardId}/columns/${columnId}/tasks`,
    ),

  createTask: (
    projectId: string,
    columnId: string,
    boardId: string,
    data: any,
  ) =>
    apiFetch(
      `/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),

  updateTask: (
    projectId: string,
    columnId: string,
    boardId: string,
    data: any,
    taskId: string,
  ) =>
    apiFetch(
      `/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
    ),

  moveTask: (
    projectId: string,
    columnId: string,
    boardId: string,
    status: any,
    taskId: string,
  ) =>
    apiFetch(
      `/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/move`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
    ),

  deleteTask: (
    projectId: string,
    columnId: string,
    boardId: string,
    taskId: string,
  ) =>
    apiFetch(
      `/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}`,
      {
        method: 'DELETE',
      },
    ),
};
