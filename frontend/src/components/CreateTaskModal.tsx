import { useState } from "react";
import { taskApi } from "../api/tasks.api";
import  { IssueType , Priority } from "../types/models";
import type { TaskDTO } from "../types/dtos";
import { useParams } from "react-router-dom";
import { type Task } from "../types/models";

interface Props {
  order: number;
  columnId: string;
  onClose: () => void;
  onSuccess: (task: Task) => void; 
}

export const CreateTaskModal = ({order, columnId, onClose, onSuccess }: Props) => {
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

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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
    <div style={{ background: "white", padding: "20px", borderRadius: "8px" }}>
      <h3>Create Task</h3>

      {/* Title */}
      <input
        placeholder="Title"
        value={form.title}
        onChange={(e) => handleChange("title", e.target.value)}
      />

      {/* Description */}
      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) => handleChange("description", e.target.value)}
      />

      {/* Issue Type */}
      <select
        value={form.issueType}
        onChange={(e) => handleChange("issueType", e.target.value)}
      >
        {Object.values(IssueType).map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      {/* Priority */}
      <select
        value={form.priority}
        onChange={(e) => handleChange("priority", e.target.value)}
      >
        {Object.values(Priority).map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      {/* Assignee */}
      <input
        placeholder="Assignee ID"
        value={form.assigneeId}
        onChange={(e) => handleChange("assigneeId", e.target.value)}
      />

      {/* Parent Task */}
      <input
        placeholder="Parent Task ID"
        value={form.parentId}
        onChange={(e) => handleChange("parentId", e.target.value)}
      />

      {/* Due Date */}
      <input
        type="date"
        value={form.dueDate}
        onChange={(e) => handleChange("dueDate", e.target.value)}
      />

      <div style={{ marginTop: "10px" }}>
        <button onClick={handleSubmit}>Create</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};