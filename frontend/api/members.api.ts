import { apiFetch } from "./client";

export const memberApi={

    addMember:(projectId:string , userId:string )=>
         apiFetch(`/projects/${projectId}/members/${userId}`, {
            method:"POST"
         }),

    deleteMember:(projectId:string , userId:string) =>
        apiFetch(`/projects/${projectId}/members/${userId}`, {
            method:"DELETE"
         }),
    
     updateRole:(projectId:string , userId:string, role :string ) =>
        apiFetch(`/projects/${projectId}/members/${userId}/role/${role}`, {
            method:"PATCH",
         }),
    
};