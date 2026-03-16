import { apiFetch } from "./client";
import { type Project} from '../src/types/models';

export const projectApi = {

  getProjects: (): Promise<Project[]> => apiFetch("/projects"),

  createProject: (userId:string ,data: {
    projectname: string;
    description?: string;
  }): Promise<Project> => apiFetch(`/projects/user/${userId}`, {
    method: "POST",
    body: JSON.stringify(data)
  }),

  getProject: (projectId?: string): Promise<Project> =>
  apiFetch(projectId ? `/projects/${projectId}` : `/projects`),

  updateProject: (projectId: string, data: {
    projectname:string ,
    description?:string
  }): Promise<Project> =>
    apiFetch(`/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    }),

  archiveProject: (projectId: string): Promise<Project> =>
    apiFetch(`/projects/${projectId}/archive`, {
      method: "POST"
    })

 
};