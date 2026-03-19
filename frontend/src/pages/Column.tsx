import {  useState } from "react";
import { type Column as ColumnType, type Task } from "../types/models";
import { CreateTaskModal } from "../components/CreateTaskModal";
import styles from "./ProjectBoard.module.css"; 


interface Props {
  column: ColumnType;
  tasks:Task[];
  onTaskCreated:(task:Task )=>void;
  onTaskMove:(taskId:string , sourceColumnId:string , targetColumnId:string , newOrder:number)=>void;
  onTaskDelete:(taskId:string )=>void;
  onColumnDelete:(columnId:string)=>void;
}


export default function Column({ column,tasks,onTaskCreated , onTaskMove, onTaskDelete, onColumnDelete}: Props) {

  const [showModal, setShowModal] = useState(false);



const handleDrop = (e: any, dropOrder?: number) => {
  e.preventDefault();
  e.stopPropagation();
  const dataStr = e.dataTransfer.getData("text/plain");
  if (!dataStr) return;
  
  const { taskId, sourceColumnId } = JSON.parse(dataStr);
  const targetColumnId = String(column.id);
  
  // If dropped on a specific task, use its order. If dropped on the empty space, add to end.
  const newOrder = dropOrder !== undefined ? dropOrder : tasks.length;
  onTaskMove(String(taskId), String(sourceColumnId), targetColumnId, newOrder);
};

  return (
    <div className={styles.modalCard} style={{ minWidth: "280px", background: "#f9fafb" }} >
      {/* Column Header */}
      <div className={styles.sectionHeader} style={{ marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{column.title}</h3>
      </div>
      <button onClick={()=>onColumnDelete(String(column.id))}>x</button>

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
             style={{ cursor: "grab" }} 
              draggable
                onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, task.order)}
               onDragStart={(e) => {
             e.dataTransfer.setData("text/plain",
                JSON.stringify({taskId: task.id,  sourceColumnId: task.columnId }) );}}>
                <button onClick={()=>{onTaskDelete(String(task.id))}}> x </button>
              <div className={styles.storyMeta}>
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