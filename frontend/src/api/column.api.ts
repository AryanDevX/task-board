import { apiFetch  } from "./client";
import { type Column } from "../types/models";

export const columnApi = {
  getColumns: (boardId: string , projectId:string ):(Promise<Column[]>) =>
    apiFetch(`/projects/${projectId}/boards/${boardId}/columns`),

};