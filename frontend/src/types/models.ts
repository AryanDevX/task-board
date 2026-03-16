//Enums:
export type GlobalRole = 'GLOBAL_ADMIN' | 'USER';
export type ProjectRole = 'PROJECT_ADMIN' | 'PROJECT_MEMBER' | 'PROJECT_VIEWER';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ActivityType = 'STATUS_CHANGE' | 'ASSIGNEE_CHANGE' | 'PRIORITY_CHANGE' | 'COMMENT_ADDED' | 'COMMENT_EDITED' | 'COMMENT_DELETED' | 'TASK_CREATED';
export type IssueType = 'STORY' | 'TASK' | 'BUG';
export type NotificationType = 'TASK_ASSIGNED' | 'STATUS_CHANGED' | 'COMMENT_ADDED' | 'USER_MENTIONED';


//Models:
export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  globalRole: GlobalRole;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  createdById: number;
  archived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMembership {
  id: number;
  userId: number;
  projectId: number;
  role: ProjectRole;
}

export interface Board {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: number;
  title: string;
  order: number;
  boardId: number;
  wipLimit: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  title: string;
  columnId: number;
  description: string | null;
  order: number;
  issueType: IssueType;
  priority: Priority;
  parentId: number | null;
  assigneeId: number | null;
  reporterId: number;
  createdAt: string;
  updatedAt: string | null;
  dueDate: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
}

export interface Comment {
  id: number;
  content: string;
  taskId: number;
  authorId: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: number;
  taskId: number;
  userId: number;
  type: ActivityType;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface WorkflowTransition {
  id: number;
  projectId: number;
  boardId: number;
  fromColumnId: number;
  toColumnId: number;
}

export interface Notification {
  id: number;
  userId: number;
  taskId: number | null;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: number;
  message: string;
  type: 'assignment' | 'deadline' | 'comment';
  isRead: boolean;
  createdAt: string;
  projectId?: number; // So the user can click to go to the project
}