import { apiFetch } from './client';
import { type Project } from '../types/models';

export const projectApi = {
  getProjects: (): Promise<{ projects: Project[] }> => apiFetch('/projects'),

  createProject: (data: {
    projectname: string;
    description?: string;
  }): Promise<{ message: string; project: Project }> =>
    apiFetch(`/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProject: (projectId?: string): Promise<{ projects: Project[] }> =>
    apiFetch(projectId ? `/projects/${projectId}` : '/projects'),

  updateProject: (
    projectId: string,
    data: {
      projectname: string;
      description?: string;
    },
  ): Promise<Project> =>
    apiFetch(`/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  archiveProject: (projectId: string): Promise<Project> =>
    apiFetch(`/projects/${projectId}/archive`, {
      method: 'POST',
    }),
};
