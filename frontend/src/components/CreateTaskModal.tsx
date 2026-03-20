import { useEffect, useState } from "react";
import { commentApi } from "../api/comment.api";
import { taskApi } from "../api/tasks.api";
import { projectApi } from "../api/project.api";
import { IssueType, Priority, type ProjectMember } from "../types/models";
import type { CommentWithAuthor, TaskDTO, TimelineEntry, UpdateTaskDTO } from "../types/dtos";
import { useParams } from "react-router-dom";
import { type Task , type User} from "../types/models";
import { useAuth } from "../context/AuthContext";
import styles from "../styles/index.module.css";

interface Props {
  order: number;
  columnId: string;
  stories: Task[];
  onClose: () => void;
  onSuccess: (task: Task) => void;
  task?: Task;
}

export const CreateTaskModal = ({ order, columnId, stories, onClose, onSuccess, task }: Props) => {

  const { projectId, boardId } = useParams<{ projectId: string; boardId: string }>();
  const isEditing = Boolean(task);

  const { user } = useAuth();

  //Managing members
  const membersPerPage = 10;
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [membersPage, setMembersPage] = useState(1);

  //comments and timeline (only when edit)
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  //edit and delete:
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");

  //main form
  const [form, setForm] = useState({
    title: task?.title ?? "",
    description: task?.description ?? "",
    issueType: task?.issueType ?? IssueType.TASK,
    priority: task?.priority ?? Priority.Medium,
    assigneeId: task?.assigneeId ? String(task.assigneeId) : "",
    parentId: task?.parentId ? String(task.parentId) : "",
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : "",
  });

  //fetching project members for assignee.
  useEffect(() => {
    if (!projectId) return;
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

  //setting the correct task details as task change.
  useEffect(() => {
    setForm({
      title: task?.title ?? "",
      description: task?.description ?? "",
      issueType: task?.issueType ?? IssueType.TASK,
      priority: task?.priority ?? Priority.Medium,
      assigneeId: task?.assigneeId ? String(task.assigneeId) : "",
      parentId: task?.parentId ? String(task.parentId) : "",
      dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : "",
    });
  }, [task]);

  //fetching task comments and activity timeline (during update).
  useEffect(() => {
    //if creating a new task then clear old things.
    if (!task || !projectId || !boardId) {
      setComments([]);
      setCommentInput("");
      setTimeline([]);
      setTimelineError(null);
      setIsTimelineLoading(false);
      setEditingCommentId(null);
      return;
    }
    
    const loadTaskDetails = async () => {
      try {
        setIsTimelineLoading(true);
        setTimelineError(null);
        //fetching both task details and comments.
        const [taskDetails, taskComments] = await Promise.all([
          taskApi.getTask(
            projectId,
            boardId,
            columnId,
            String(task.id),
          ),
          commentApi.getCommentsByTask(String(task.id), projectId),
        ]);
        setComments(taskComments);
        setTimeline(taskDetails.activityTimeline ?? []);
      } catch (err) {
        console.error("Failed to load task activity timeline:", err);
        setTimelineError("Failed to load activity timeline.");
      } finally {
        setIsTimelineLoading(false);
      }
    };

    void loadTaskDetails();
  }, [task, projectId, boardId, columnId]);

  //refetching if new comment added:
  const refreshTaskActivity = async () => {
    if (!task || !projectId || !boardId) return;

    try {
      const [taskDetails, taskComments] = await Promise.all([
        taskApi.getTask(
          projectId,
          boardId,
          columnId,
          String(task.id),
        ),
        commentApi.getCommentsByTask(String(task.id), projectId),
      ]);
      setComments(taskComments);
      setTimeline(taskDetails.activityTimeline ?? []);
    } catch (err) {
      console.error("Failed to refresh task activity:", err);
    }
  };

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const stripHtml = (value: string) => {
    const doc = new DOMParser().parseFromString(value, "text/html");
    return doc.body.textContent?.trim() ?? "";
  };

  const formatTimelineEvent = (entry: TimelineEntry) => {
    switch (entry.field) {
      case "TASK_CREATED": return "created this task.";
      case "STATUS_CHANGE": return `changed status from ${entry.oldValue ?? "Unknown"} to ${entry.newValue ?? "Unknown"}.`;
      case "ASSIGNEE_CHANGE": return `changed assignee from ${entry.oldValue ?? "Unassigned"} to ${entry.newValue ?? "Unassigned"}.`;
      case "PRIORITY_CHANGE": return `changed priority from ${entry.oldValue ?? "Unknown"} to ${entry.newValue ?? "Unknown"}.`;
      case "COMMENT_ADDED": return "added a comment.";
      case "COMMENT_EDITED": return "edited a comment.";
      case "COMMENT_DELETED": return "deleted a comment.";
      default: return "updated this task.";
    }
  };

  const handleAddComment = async () => {
    if (!task || !projectId || !commentInput.trim()) return;
    try {
      setIsCommentSubmitting(true);
      const createdComment = await commentApi.createComment(String(task.id), projectId, {
        content: commentInput.trim(),
      });
      setCommentInput("");
      setComments((prev) => [createdComment, ...prev]);
      await refreshTaskActivity();
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  //handles for edit and delete:
  const handleEditSubmit = async (commentId: string) => {
    if (!editCommentContent.trim() || !projectId || !task) return;
    try {
      await commentApi.updateComment(commentId, projectId, String(task.id), { 
        content: editCommentContent.trim() 
      });
      setEditingCommentId(null);
      await refreshTaskActivity();
    } catch (err) {
      console.error("Failed to update comment:", err);
      alert("Failed to update comment.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!projectId || !task) return;
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      // deleteComment params: commentId, taskId, projectId
      await commentApi.deleteComment(commentId, String(task.id), projectId);
      setComments((prev) => prev.filter(c => String(c.id) !== commentId));
      await refreshTaskActivity();
    } catch (err) {
      console.error("Failed to delete comment:", err);
      alert("Failed to delete comment.");
    }
  };

  const totalMemberPages = Math.max(1, Math.ceil(members.length / membersPerPage));
  const pageStart = (membersPage - 1) * membersPerPage;
  const pagedMembers = members.slice(pageStart, pageStart + membersPerPage);
  const selectedMember = members.find((member) => String(member.userId) === form.assigneeId);

  const visibleMembers = selectedMember && !pagedMembers.some((member) => member.userId === selectedMember.userId)
      ? [selectedMember, ...pagedMembers]
      : pagedMembers;

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      alert("Title is required");
      return;
    }
    try {
      if (isEditing && task) {
        const payload = {
          ...form,
          columnId,
          assigneeId: form.assigneeId || null,
          parentId: form.parentId || null,
          dueDate: form.dueDate || null,
          order,
        } as UpdateTaskDTO;

        const updatedTask = await taskApi.updateTask(projectId!, boardId!, columnId, String(task.id), payload);
        onSuccess(updatedTask);
      } else {
        const payload = {
          ...form,
          columnId,
          assigneeId: form.assigneeId || undefined,
          parentId: form.parentId || undefined,
          dueDate: form.dueDate || undefined,
          order,
        } as TaskDTO;
        const newTask = await taskApi.createTask(projectId!, boardId!, columnId, payload);
        onSuccess(newTask);
      }
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const isStory = form.issueType === IssueType.STORY;

  return (
    <div className={styles.surfaceCard}>
      <h3 className={styles.cardTitle}>{isEditing ? "Update Task" : "Create Task"}</h3>

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
            rows={3}
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

        {!isStory && (
          <>
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
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>
                  {members.length === 0
                    ? "No project users available."
                    : `Showing ${Math.min(pageStart + 1, members.length)}-${Math.min(pageStart + membersPerPage, members.length)} of ${members.length} project users`}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                    onClick={() => setMembersPage((page) => Math.max(1, page - 1))}
                    disabled={membersPage === 1 || isMembersLoading}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                    onClick={() => setMembersPage((page) => Math.min(totalMemberPages, page + 1))}
                    disabled={membersPage === totalMemberPages || isMembersLoading}
                  >
                    Next
                  </button>
                </div>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                {isMembersLoading
                  ? "Loading project users..."
                  : membersError || "Only users already added to this project can be assigned."}
              </p>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="task-parent">Parent Issue</label>
              <select
                id="task-parent"
                className={styles.input}
                value={form.parentId}
                onChange={(e) => handleChange("parentId", e.target.value)}
              >
                <option value="">None (Standalone)</option>
                {stories.map(story => (
                  <option key={story.id} value={story.id}>{story.title}</option>
                ))}
              </select>
            </div>
          </>
        )}

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
            {isEditing ? "Update" : "Create"}
          </button>
          <button className={styles.secondaryButton} onClick={onClose} type="button">
            Cancel
          </button>
        </div>

        {isEditing && (
          <section className={styles.timelineSection}>
            <h4 className={styles.timelineTitle}>Comments</h4>
            <div className={styles.commentComposer}>
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                placeholder="Add a comment..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
              />
              <div className={styles.commentComposerActions}>
                <span className={styles.helperText}>
                  {commentInput.trim().length} characters
                </span>
                <button
                  className={styles.primaryButton}
                  type="button"
                  onClick={handleAddComment}
                  disabled={isCommentSubmitting || !commentInput.trim()}
                >
                  {isCommentSubmitting ? "Posting..." : "Add Comment"}
                </button>
              </div>
            </div>
            
            {comments.length === 0 ? (
              <p className={styles.helperText}>No comments yet.</p>
            ) : (
              <div className={styles.timelineList}>
                {comments.map((comment) => {
                  //Is user comment:
                  const isMyComment = user && (String(user.id) === String(comment.author.id) || String((user as User ).id) === String(comment.author.id));

                  return (
                    <article key={comment.id} className={styles.timelineItem}>
                      <div className={styles.timelineHeader}>
                        <span className={styles.timelineAuthor}>{comment.author.username}</span>
                        <span className={styles.timelineDate}>
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {/* --- EDIT COMMENT RENDER --- */}
                      {editingCommentId === String(comment.id) ? (
                        <div className={styles.commentComposer}>
                          <textarea
                            className={`${styles.input} ${styles.textarea}`}
                            value={editCommentContent}
                            onChange={(e) => setEditCommentContent(e.target.value)}
                            rows={3}
                          />
                          <div className={styles.buttonRow} style={{ marginTop: "8px", justifyContent: "flex-start" }}>
                            <button 
                              className={styles.primaryButton}
                              type="button"
                              onClick={() => handleEditSubmit(String(comment.id))}
                            >
                              Save
                            </button>
                            <button 
                              className={styles.secondaryButton}
                              type="button"
                              onClick={() => setEditingCommentId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className={styles.timelineComment}>
                            {stripHtml(comment.content) || "Comment content unavailable."}
                          </p>
                          
                          {/* Show Edit/Delete ONLY if the current user wrote it */}
                          {isMyComment && (
                            <div className={styles.buttonRow} style={{ marginTop: '8px', gap: '8px', justifyContent: 'flex-start' }}>
                              <button
                                type="button"
                                className={styles.smallButton}
                                onClick={() => {
                                  setEditingCommentId(String(comment.id));
                                  setEditCommentContent(stripHtml(comment.content));
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className={styles.smallButton}
                                style={{ color: '#dc2626', borderColor: '#fca5a5', backgroundColor: 'transparent' }}
                                onClick={() => handleDeleteComment(String(comment.id))}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            <h4 className={styles.timelineTitle}>Activity Timeline</h4>
            {isTimelineLoading ? (
              <p className={styles.helperText}>Loading activity...</p>
            ) : timelineError ? (
              <p className={styles.helperText}>{timelineError}</p>
            ) : timeline.length === 0 ? (
              <p className={styles.helperText}>No activity yet.</p>
            ) : (
              <div className={styles.timelineList}>
                {timeline.map((entry) => (
                  <article key={entry.id} className={styles.timelineItem}>
                    <div className={styles.timelineHeader}>
                      <span className={styles.timelineAuthor}>{entry.user.username}</span>
                      <span className={styles.timelineDate}>
                        {new Date(entry.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {entry.type === "comment" ? (
                      <p className={styles.timelineComment}>
                        {stripHtml(entry.content ?? "") || "Comment content unavailable."}
                      </p>
                    ) : (
                      <p className={styles.timelineEvent}>{formatTimelineEvent(entry)}</p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};