import { apiFetch } from "./client";

export const projectApi = {

  getProjects: () => apiFetch("/projects"),

  createProject: (userId:string ,data: {
    projectname: string;
    description?: string;
  }) => apiFetch(`/projects/user/${userId}`, {
    method: "POST",
    body: JSON.stringify(data)
  }),

  getProject: (projectId?: string) =>
  apiFetch(projectId ? `/projects/${projectId}` : `/projects`),

  updateProject: (projectId: string, data: {
    projectname:string ,
    description?:string
  }) =>
    apiFetch(`/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    }),

  archiveProject: (projectId: string) =>
    apiFetch(`/projects/${projectId}/archive`, {
      method: "POST"
    })
};