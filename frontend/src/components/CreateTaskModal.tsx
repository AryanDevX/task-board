import { useEffect, useState } from "react";
import { taskApi } from "../api/tasks.api";
import { projectApi } from "../api/project.api";
import { IssueType, Priority, type ProjectMember } from "../types/models";
import type { TaskDTO } from "../types/dtos";
import { useParams } from "react-router-dom";
import { type Task } from "../types/models";
import styles from "../styles/index.module.css";

interface Props {
  order: number;
  columnId: string;
  onClose: () => void;
  onSuccess: (task: Task) => void; 
}

export const CreateTaskModal = ({order, columnId, onClose, onSuccess }: Props) => {
  const membersPerPage = 10;
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [membersPage, setMembersPage] = useState(1);
  const [form, setForm] = useState({
    title: "",
    description: "",
    issueType: IssueType.TASK,
    priority: Priority.Medium,
    assigneeId: "",
    parentId: "",
    dueDate: "",
  });
  const {projectId , boardId} = useParams<{projectId:string ; boardId:string}>();

  useEffect(() => {
    if(!projectId) return;

    const loadMembers = async () => {
      try {
        setIsMembersLoading(true);
        setMembersError(null);
        const response = await projectApi.getMembers(projectId);
        setMembers(response.members);
      } catch (err) {
        console.error("Failed to load project members:", err);
        setMembersError("Failed to load project users.");
      } finally {
        setIsMembersLoading(false);
      }
    };

    void loadMembers();
  }, [projectId]);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const totalMemberPages = Math.max(1, Math.ceil(members.length / membersPerPage));
  const pageStart = (membersPage - 1) * membersPerPage;
  const pagedMembers = members.slice(pageStart, pageStart + membersPerPage);
  const selectedMember = members.find(
    (member) => String(member.userId) === form.assigneeId,
  );
  const visibleMembers =
    selectedMember &&
    !pagedMembers.some((member) => member.userId === selectedMember.userId)
      ? [selectedMember, ...pagedMembers]
      : pagedMembers;

  const handleSubmit = async () => {

    if (!form.title.trim()) { alert("Title is required");return;}

    const payload = {
      ...form,
      columnId,
      assigneeId: form.assigneeId || undefined,
      parentId: form.parentId || undefined,
      dueDate: form.dueDate || undefined,
      order
    } as TaskDTO;

    try {
      const newTask = await taskApi.createTask(projectId!,boardId!, columnId,  payload);
      onSuccess(newTask);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.surfaceCard}>
      <h3 className={styles.cardTitle}>Create Task</h3>

      <div className={styles.form}>
        <div className={styles.fieldGroup}>
          <label htmlFor="task-title">Title</label>
          <input
            id="task-title"
            className={styles.input}
            placeholder="Title"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="task-description">Description</label>
          <textarea
            id="task-description"
            className={`${styles.input} ${styles.textarea}`}
            placeholder="Description"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="task-issue-type">Issue Type</label>
          <select
            id="task-issue-type"
            className={styles.input}
            value={form.issueType}
            onChange={(e) => handleChange("issueType", e.target.value)}
          >
            {Object.values(IssueType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="task-priority">Priority</label>
          <select
            id="task-priority"
            className={styles.input}
            value={form.priority}
            onChange={(e) => handleChange("priority", e.target.value)}
          >
            {Object.values(Priority).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="task-assignee">Assignee</label>
          <select
            id="task-assignee"
            className={styles.input}
            value={form.assigneeId}
            onChange={(e) => handleChange("assigneeId", e.target.value)}
            disabled={isMembersLoading}
          >
            <option value="">Unassigned</option>
            {visibleMembers.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.username} ({member.email})
              </option>
            ))}
          </select>
          <div className={styles.inlineControls}>
            <p className={styles.helperText}>
              {members.length === 0
                ? "No project users available."
                : `Showing ${Math.min(pageStart + 1, members.length)}-${Math.min(
                    pageStart + membersPerPage,
                    members.length,
                  )} of ${members.length} project users`}
            </p>
            <div className={styles.inlineControls}>
              <button
                type="button"
                className={styles.smallButton}
                onClick={() => setMembersPage((page) => Math.max(1, page - 1))}
                disabled={membersPage === 1 || isMembersLoading}
              >
                Previous
              </button>
              <button
                type="button"
                className={styles.smallButton}
                onClick={() => setMembersPage((page) => Math.min(totalMemberPages, page + 1))}
                disabled={membersPage === totalMemberPages || isMembersLoading}
              >
                Next
              </button>
            </div>
          </div>
          <p className={styles.helperText}>
            {isMembersLoading
              ? "Loading project users..."
              : membersError || "Only users already added to this project can be assigned."}
          </p>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="task-parent">Parent Task ID</label>
          <input
            id="task-parent"
            className={styles.input}
            placeholder="Parent Task ID"
            value={form.parentId}
            onChange={(e) => handleChange("parentId", e.target.value)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="task-due-date">Due Date</label>
          <input
            id="task-due-date"
            className={styles.input}
            type="date"
            value={form.dueDate}
            onChange={(e) => handleChange("dueDate", e.target.value)}
          />
        </div>

        <div className={styles.buttonRow}>
          <button className={styles.primaryButton} onClick={handleSubmit} type="button">
            Create
          </button>
          <button className={styles.secondaryButton} onClick={onClose} type="button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
