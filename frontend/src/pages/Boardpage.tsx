import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { columnApi } from "../api/column.api";
import { type Column as Columntype } from "../types/models";
import Column from "./Column";
import styles from "./ProjectBoard.module.css"; 
import { CreateColumnModal } from "../components/CreateColumnModal";
import type {  Task } from "../types/models";
import { taskApi } from "../api/tasks.api";

export const BoardPage = () => {
  const navigate = useNavigate();
  const { boardId, projectId } = useParams<{ projectId: string, boardId: string; }>();
  const [addModal ,SetAddModal]= useState(false);
   const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Columntype[]>([]);
  const [loading, setLoading] = useState(false);

  const handleColumnCreator= (col:Columntype)=>{
    setColumns((prev)=>[...prev,col]);
    SetAddModal(false);
  }

  const handleTaskCreator= (task:Task)=>{
    setTasks(prev=>[...prev, task]);

  }

const handleTaskMove = async (taskId: string, sourceColumnId: string, targetColumnId: string, newOrder: number) => {
  const targetCol = columns.find(col => String(col.id) === targetColumnId);
  const targetColTasks = tasks.filter(t => String(t.columnId) === targetColumnId);

  // Enforce WIP limits locally before moving
  if (
    targetCol?.wipLimit && 
    ((sourceColumnId !== targetColumnId && targetColTasks.length >= targetCol.wipLimit) ||
    (sourceColumnId === targetColumnId && targetColTasks.length > targetCol.wipLimit))
  ) {
    alert(`Wip Limit of Column ${targetCol.title} exceeded`);
    return;
  }

  // Optimistic UI Update (updates local state instantly)
  setTasks(prev => {
    const updated = prev.map(task => 
      String(task.id) === taskId 
        ? { ...task, columnId: Number(targetColumnId), order: newOrder } 
        : task
    );
    return updated.sort((a, b) => a.order - b.order);
  });

  try {
    // Sync with backend (Ensure this matches your actual taskApi parameter signature)
    await taskApi.moveTask(
      projectId!, 
      boardId!, 
      sourceColumnId, 
      taskId, 
      targetColumnId, 
      String(newOrder)
    );
  } catch (error) {
    console.error("Failed to move task:", error);
    // Optionally: Re-fetch tasks here to revert state if the API fails
  }
};

  useEffect(() => {
    if (!boardId || !projectId) return;

    const fetchColumns = async () => {
      try {
        setLoading(true);
        const data = await columnApi.getColumns(projectId , boardId);
        setColumns(data);
      const taskPromises = data.map((col: Columntype) => 
      taskApi.getTasks(projectId!, boardId!, String(col.id))
    );
    const results = await Promise.all(taskPromises);
    const allTasks = results.flat(); 
    setTasks(allTasks);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchColumns();
  }, [boardId, projectId]);

  const handleTaskDelete = async ( taskId: string) => {
  try {
    const currTask=tasks.find(t=>String(t.id)===taskId);
    const columnId=String(currTask?.columnId);
    await taskApi.deleteTask(projectId!,boardId!,columnId!,taskId);
    setTasks((prev) => prev.filter((t) => t.id !== parseInt(taskId)));
  } catch (err) {
    console.error(err);
  }
};

const handleColumnDelete = async (columnId: string) => {
  try {
    const val=tasks.filter(t=>String(t.columnId)===columnId);
    if(val.length!==0){alert(" Column is Not empty"); return;
    }
    await columnApi.deleteColumn(projectId!, boardId!, columnId);

    setColumns((prev) => prev.filter((c) => String(c.id) !== columnId));
  } catch (err) {
    console.error(err);
  }
};

  if (loading) return <div className={styles.state}>Loading columns...</div>;

  return (
    <div className={styles.page}>
      {/* Navigation Header */}
      <header className={styles.topBar}>
        <button
          className={styles.backButton}
          onClick={() => navigate(`/project/${projectId}`)}
        >
          ← Back to Boards
        </button>
        
        <div className={styles.headerActions}>
           <button className={styles.secondaryButton}>Board Settings</button>
        </div>
      </header>

      {/* Board Title Section */}
      <section className={styles.sectionHeader}>
        <div>
          <h1 className={styles.title}>Board Workflow</h1>
          <p className={styles.subtitle}>Drag and drop tasks to update status.</p>
        </div>
        <button className={styles.primaryButton}
        onClick={()=>SetAddModal(!addModal)}>+ Add Column</button>
      </section>

      {/* Columns Container */}
      <div 
        className={styles.section} 
        style={{ 
          display: "flex", 
          gap: "1.5rem", 
          overflowX: "auto", 
          paddingBottom: "1rem",
          alignItems: "flex-start" 
        }}
      >
        {columns.length === 0 ? (
          <div className={styles.emptyCard}>
            No columns defined for this board yet.
          </div>
        ) : (
          columns.map((col) => (
            <div key={col.id} style={{ minWidth: "300px" }} >
              <Column 
              column={col} 
              tasks={tasks.filter(t=>t.columnId===col.id)}
              onTaskCreated= {handleTaskCreator }
              onTaskMove={handleTaskMove}
              onTaskDelete={handleTaskDelete}
              onColumnDelete={handleColumnDelete}
              />
            </div>
          ))
        )}
      </div>

       {addModal && (
              <CreateColumnModal
                projectId={projectId!}
                nextOrder={columns.length}
                onClose={() => SetAddModal(false)}
                onSuccess={handleColumnCreator}
              />
            )}
    </div>
  );
};
