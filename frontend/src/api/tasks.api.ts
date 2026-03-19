import type { Task } from '../types/models';
import { apiFetch } from './client';
import { type TaskDTO } from '../types/dtos';

export const taskApi = {
  getTasks: ( projectId:string , boardId:string,columnId: string  ):Promise<Task[]> =>
    apiFetch(`/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks`),

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


    moveTask:  (
    projectId: string,
    boardId: string,
    columnId: string,
    taskId: string ,
    targetColumnId: string,
    newOrder: string 
  ): Promise<Task> =>
    apiFetch(
      `/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/move`,
      {
        method: 'PATCH',
        body: JSON.stringify({
         targetColumnId, newOrder
        }),
      },
    ),

      deleteTask: (
    projectId: string,
    boardId: string,
    columnId: string,
    taskId: string 
  ): Promise<Task> =>
    apiFetch(
      `/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}`,
      {
        method: 'DELETE',
      },
    ),

};
