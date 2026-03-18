import { apiFetch } from './client';
import { type Project, type ProjectMembership } from '../types/models';

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

  addMember: (
    projectId: string, 
    userId: string,
    role?:string,
  ): Promise<{ message: string; membership: ProjectMembership }> =>
    apiFetch(`/projects/${projectId}/members/${userId}`, {
      method: 'POST',
      body: JSON.stringify({role}),
    }),

  removeMember: (
    projectId: string, 
    userId: string
  ): Promise<{ message: string }> =>
    apiFetch(`/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    }),

  updateMemberRole: (
    projectId: string, 
    userId: string, 
    role: 'PROJECT_ADMIN' | 'PROJECT_MEMBER' | 'PROJECT_VIEWER'
  ): Promise<{ message: string }> =>
    apiFetch(`/projects/${projectId}/members/${userId}/role/${role}`, {
      method: 'PATCH',
    }),
};

