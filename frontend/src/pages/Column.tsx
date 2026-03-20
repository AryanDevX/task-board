import { useEffect, useState } from "react";
import { type Column as ColumnType, type Task } from "../types/models";
import { CreateTaskModal } from "../components/CreateTaskModal";
import { EditColumnModal } from "../components/EditColumnModal";
import styles from "./ProjectBoard.module.css";
import modalStyles from "../styles/index.module.css";

interface Props {
  column: ColumnType;
  tasks: Task[];
  onTaskCreated: (task: Task) => void;
  onTaskUpdated: (task: Task) => void;
  onTaskMove: (taskId: string, sourceColumnId: string, targetColumnId: string, newOrder: number) => void;
  onTaskDelete: (taskId: string) => void;
  onColumnDelete: (columnId: string) => void;
  onColumnMove?: (columnId: string, newOrder: number) => void;
  onColumnUpdate: (column: ColumnType) => void;
}

export default function Column({ 
  column, 
  tasks, 
  onTaskCreated, 
  onTaskUpdated,
  onTaskMove, 
  onTaskDelete, 
  onColumnDelete, 
  onColumnMove, 
  onColumnUpdate 
}: Props) {

  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!selectedTask) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedTask]);

  const handleDrop = (e: React.DragEvent<HTMLElement>, targetTask?: Task, isBelow?: boolean) => {    e.preventDefault();
    e.stopPropagation();
    const dataStr = e.dataTransfer.getData("text/plain");
    if (!dataStr) return;
    
    const data = JSON.parse(dataStr);
    
    if (data.type === "column" && onColumnMove) {
      onColumnMove(data.columnId, column.order);
      return;
    }

    const { taskId, sourceColumnId, sourceOrder } = data;
    if (!taskId) return;
    const targetColumnId = String(column.id);
    
    if (targetTask && String(targetTask.id) === String(taskId)) {
      return;
    }
    
    let newOrder = tasks.length;
    if (targetTask !== undefined) {
      const isSameColumn = String(sourceColumnId) === targetColumnId;
      if (isSameColumn && sourceOrder !== undefined) {
        if (sourceOrder < targetTask.order) {
          newOrder = isBelow ? targetTask.order : targetTask.order - 1;
        } else {
          newOrder = isBelow ? targetTask.order + 1 : targetTask.order;
        }
      } else {
        newOrder = isBelow ? targetTask.order + 1 : targetTask.order;
      }
    }
    
    onTaskMove(String(taskId), String(sourceColumnId), targetColumnId, Math.max(0, newOrder));
  };

  return (
    <div
      className={styles.columnContainer}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", JSON.stringify({ type: "column", columnId: String(column.id) }));
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => handleDrop(e)}
    >
      <div className={styles.columnHeader}>
        <div className={styles.columnHeading}>
          <h3 className={styles.columnTitle}>{column.title}</h3>
          {column.wipLimit !== null && (
            <span
              className={styles.wipBadge}
              style={{ color: tasks.length > column.wipLimit ? "#dc2626" : undefined }}
            >
              WIP: {tasks.length} / {column.wipLimit}
            </span>
          )}
        </div>
        <div className={styles.columnActions}>
          <button className={styles.iconActionBtn} onClick={() => setShowEditModal(true)}>Edit</button>
          <button className={`${styles.iconActionBtn} ${styles.deleteBtn}`} onClick={() => onColumnDelete(String(column.id))}>x</button>
        </div>
      </div>

      <div 
        className={styles.taskList}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e)}
      >
        {tasks.length === 0 ? (
          <p className={`${modalStyles.helperText} ${styles.emptyColumnText}`}>
            No tasks yet
          </p>
        ) : (
          tasks.map((task) => (
            <article 
              key={task.id} 
              className={styles.taskCard}
              draggable
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const isBelowMidpoint = e.clientY > rect.top + rect.height / 2;
                handleDrop(e, task, isBelowMidpoint);
              }}
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.setData("text/plain",
                  JSON.stringify({ type: 'task', taskId: task.id, sourceColumnId: task.columnId, sourceOrder: task.order })
                );
              }}
              onClick={() => setSelectedTask(task)}
            >
              <button 
                className={styles.taskDeleteBtn}
                onClick={(e) => { 
                  e.stopPropagation();
                  onTaskDelete(String(task.id)); 
                }}
              >
                x
              </button>
              
              <div className={styles.taskMeta}>
                <span className={task.priority === "CRITICAL" ? styles.priorityCritical : styles.priorityDefault}>
                  {task.priority}
                </span>
              </div>
              <h4 className={styles.taskTitle}>{task.title}</h4>
              {task.description && (
                <p className={styles.taskDescription}>
                  {task.description}
                </p>
              )}
            </article>
          ))
        )}
      </div>

      <div className={styles.addTaskWrapper}>
        <button 
          className={`${modalStyles.secondaryButton} ${modalStyles.fullWidth}`}
          onClick={() => {
            if (column.wipLimit !== null && tasks.length >= column.wipLimit) {
              alert(`WIP limit of ${column.wipLimit} reached for ${column.title}.`);
              return;
            }
            setShowModal(!showModal);
          }}
        >
          + Add another card
        </button>
      </div>

      {showModal && (
        <CreateTaskModal
          order={tasks.length}
          columnId={String(column.id)}
          stories={[]} 
          onClose={() => setShowModal(false)}
          onSuccess={onTaskCreated}
        />
      )}

      {showEditModal && (
        <EditColumnModal
          column={column}
          onClose={() => setShowEditModal(false)}
          onSuccess={onColumnUpdate}
        />
      )}

      {selectedTask && (
        <div className={modalStyles.modalOverlay} onClick={() => setSelectedTask(null)}>
          <div className={modalStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <CreateTaskModal
              order={selectedTask.order}
              columnId={String(column.id)}
              task={selectedTask}
              stories={[]} 
              onClose={() => setSelectedTask(null)}
              onSuccess={(updatedTask) => {
                onTaskUpdated(updatedTask);
                setSelectedTask(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
