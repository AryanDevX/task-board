import {  useState } from "react";
// import { taskApi } from "../api/tasks.api";
import { type Column as ColumnType, type Task } from "../types/models";
import { CreateTaskModal } from "../components/CreateTaskModal";
// import { useParams } from "react-router-dom";
import styles from "./ProjectBoard.module.css"; // Using your shared CSS

interface Props {
  column: ColumnType;
  tasks:Task[];
  onTaskCreated:(task:Task )=>void;
}

export default function Column({ column,tasks,onTaskCreated }: Props) {

  const [showModal, setShowModal] = useState(false);

  // useEffect(() => {
  //   const fetchTasks = async () => {
  //     try {
  //       const data = await taskApi.getTasks(projectId!, boardId!, String(column.id));
  //       setTasks(data);
  //     } catch (err) {
  //       console.error("Failed to fetch tasks:", err);
  //     }
  //   };
  //   fetchTasks();
  // }, [column.id, projectId, boardId]);

  return (
    <div className={styles.modalCard} style={{ minWidth: "280px", background: "#f9fafb" }}>
      {/* Column Header */}
      <div className={styles.sectionHeader} style={{ marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{column.title}</h3>
      </div>

      {/* Task List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {tasks.length === 0 ? (
          <p className={styles.formHint} style={{ textAlign: "center", padding: "1rem" }}>
            No tasks yet
          </p>
        ) : (
          tasks.map((task) => (
            <article key={task.id} className={styles.storyCard} style={{ cursor: "pointer" }}>
              <div className={styles.storyMeta}>
                <span className={styles.metaLine}>#{task.id}</span>
                <span style={{ 
                  textTransform: 'uppercase', 
                  fontSize: '10px', 
                  fontWeight: 800,
                  color: task.priority === 'CRITICAL' ? '#ef4444' : '#6b7280'
                }}>
                  {task.priority}
                </span>
              </div>
              <h4 style={{ margin: "0.5rem 0", fontSize: "0.95rem" }}>{task.title}</h4>
              {task.description && (
                <p className={styles.storyMeta} style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {task.description}
                </p>
              )}
            </article>
          ))
        )}
      </div>

      {/* Add Task Button at bottom */}
      <button 
        className={styles.secondaryButton} 
        style={{ width: "100%", marginTop: "1rem", padding: "0.5rem" }}
        onClick={() => setShowModal(!showModal)}
      >
        + Add another card
      </button>

      {showModal && (
        <CreateTaskModal
          order={tasks.length}
          columnId={String(column.id)}
          onClose={() => setShowModal(false)}
          onSuccess={onTaskCreated}
        />
      )}
    </div>
  );
}