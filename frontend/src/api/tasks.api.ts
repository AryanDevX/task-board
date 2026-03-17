import { apiFetch } from './client';
import { type Task } from '../types/models';
import { type TaskDTO } from '../types/dtos';

export const taskApi = {
  createTask: (
    projectId: string,
    boardId: string,
    columnId: string,
    data: Omit<TaskDTO, 'columnId'>,
  ): Promise<Task> =>
    apiFetch(
      `/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks`,
      {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          columnId,
        }),
      },
    ),
};
