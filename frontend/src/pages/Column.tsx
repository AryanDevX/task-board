import { useState } from "react";
import { type Column as ColumnType, type Task } from "../types/models";
import { CreateTaskModal } from "../components/CreateTaskModal";
import styles from "./ProjectBoard.module.css"; 
import { EditColumnModal } from "../components/EditColumnModal";


interface Props {
  column: ColumnType;
  tasks:Task[];
  allTasks: Task[];
  onTaskCreated:(task:Task )=>void;
  onTaskMove:(taskId:string , sourceColumnId:string , targetColumnId:string , newOrder:number)=>void;
  onTaskDelete:(taskId:string )=>void;
  onColumnDelete:(columnId:string)=>void;
  onColumnMove?:(columnId:string, newOrder:number)=>void;
  onColumnUpdate: (column: ColumnType) => void;

}


export default function Column({ column,tasks,allTasks,onTaskCreated , onTaskMove, onTaskDelete, onColumnDelete, onColumnMove, onColumnUpdate}: Props) {

  const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);




const handleDrop = (e: any, targetTask?: Task, isBelow?: boolean) => {
  e.preventDefault();
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
  
  // Prevent dragging a task onto itself
  if (targetTask && String(targetTask.id) === String(taskId)) {
    return;
  }
  
  let newOrder = tasks.length;
  if (targetTask !== undefined) {
    const isSameColumn = String(sourceColumnId) === targetColumnId;
    if (isSameColumn && sourceOrder !== undefined) {
      if (sourceOrder < targetTask.order) { // Moving task down
        newOrder = isBelow ? targetTask.order : targetTask.order - 1;
      } else { // Moving task up
        newOrder = isBelow ? targetTask.order + 1 : targetTask.order;
      }
    } else { // Moving across different columns
      newOrder = isBelow ? targetTask.order + 1 : targetTask.order;
    }
  }
  
  onTaskMove(String(taskId), String(sourceColumnId), targetColumnId, Math.max(0, newOrder));
};

  return (
    <div 
      className={styles.modalCard} 
      style={{ minWidth: "280px", background: "#f9fafb" }} 
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", JSON.stringify({ type: "column", columnId: String(column.id) }));
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => handleDrop(e)}
    >
      {/* Column Header */}
      <div className={styles.sectionHeader} style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>{column.title}</h3>
          {column.wipLimit !== null && (
            <span style={{ fontSize: "0.8rem", color: tasks.length > column.wipLimit ? "#ef4444" : "#6b7280", fontWeight: 600 }}>
              WIP: {tasks.length} / {column.wipLimit}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => setShowEditModal(true)} style={{ cursor: "pointer", border: "none", background: "none", color: "#3b82f6", fontWeight: 600 }}>Edit</button>
          <button 
            onClick={() => onColumnDelete(String(column.id))} 
            style={{
              background: "transparent",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              fontSize: "1.2rem",
              fontWeight: "bold",
              lineHeight: 1
            }}
            onMouseOver={(e) => e.currentTarget.style.color = "#ef4444"}
            onMouseOut={(e) => e.currentTarget.style.color = "#9ca3af"}
          >
            ×
          </button>
        </div>
      </div>

      {/* Task List */}
      <div 
        style={{ display: "flex", flexDirection: "column", gap: "0.75rem", minHeight: "100px" }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e)}
      >
        {tasks.length === 0 ? (
          <p className={styles.formHint} style={{ textAlign: "center", padding: "1rem" }}>
            No tasks yet
          </p>
        ) : (
          tasks.map((task) => (
            <article key={task.id} 
            className={styles.storyCard}
             style={{ cursor: "grab", position: "relative", zIndex: 0 }} 
              draggable
                onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const isBelowMidpoint = e.clientY > rect.top + rect.height / 2;
                    handleDrop(e, task, isBelowMidpoint);
                  }}
               onDragStart={(e) => {
           if (task.issueType === 'STORY') {
             e.preventDefault();
             alert("Stories cannot be dragged directly. They automatically follow their sub-issues.");
             return;
           }
             e.stopPropagation();
             e.dataTransfer.setData("text/plain",
                JSON.stringify({ type: 'task', taskId: task.id,  sourceColumnId: task.columnId, sourceOrder: task.order }) );}}>
              <button onClick={()=>{
                if (task.issueType === 'STORY') {
                  const hasChildren = allTasks.some(t => t.parentId === task.id);
                  if (hasChildren) {
                    alert("Cannot delete a story that has active sub-issues.");
                    return;
                  }
                }
                onTaskDelete(String(task.id));
              }}
              style={{
                position: "absolute",
                top: "0.5rem",
                right: "0.5rem",
                background: "transparent",
                border: "none",
                color: "#9ca3af",
                cursor: "pointer",
                fontSize: "1.2rem",
                fontWeight: "bold",
                lineHeight: 1
              }}
              onMouseOver={(e) => e.currentTarget.style.color = "#ef4444"}
              onMouseOut={(e) => e.currentTarget.style.color = "#9ca3af"}
              >
                ×
              </button>
              <div className={styles.storyMeta} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
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
            {task.issueType === 'STORY' && (
              <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#6b7280", fontWeight: 600, display: "flex", gap: "0.5rem" }}>
              <span style={{ background: "#e5e7eb", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>{allTasks.filter(t => t.parentId === task.id).length} Sub-issues</span>
                <span style={{ background: "#dbeafe", color: "#1e40af", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>{(column as any).status || "TODO"}</span>
              </div>
            )}
            {task.issueType !== 'STORY' && task.dueDate && (
              <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#9ca3af", fontWeight: 500 }}>
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </div>
            )}
            <span style={{ 
              position: "absolute",
              bottom: "0.5rem",
              right: "0.5rem",
              textTransform: 'uppercase', 
              fontSize: '10px', 
              fontWeight: 800,
              color: task.issueType === 'BUG' ? '#ef4444' : task.issueType === 'STORY' ? '#8b5cf6' : '#eab308'
            }}>
              {task.issueType}
            </span>
            </article>
          ))
        )}
      </div>

      {/* Add Task Button at bottom */}
      <button 
        className={styles.secondaryButton} 
        style={{ width: "100%", marginTop: "1rem", padding: "0.5rem" }}
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

      {showModal && (
        <CreateTaskModal
          order={tasks.length}
          columnId={String(column.id)}
          stories={allTasks.filter((t) => t.issueType === 'STORY')}
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
    </div>
  );
}
