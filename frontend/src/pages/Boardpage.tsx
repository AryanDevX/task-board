import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { columnApi } from "../api/column.api";
import { type Column as Columntype } from "../types/models";
import Column from "./Column";
import styles from "./ProjectBoard.module.css"; // Using your shared CSS
import { CreateColumnModal } from "../components/CreateColumnModal";
import type { Task } from "../types/models";

export const BoardPage = () => {
  const navigate = useNavigate();
  const { boardId, projectId } = useParams<{ boardId: string; projectId: string }>();
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

  useEffect(() => {
    if (!boardId || !projectId) return;

    const fetchColumns = async () => {
      try {
        setLoading(true);
        const data = await columnApi.getColumns(boardId , projectId);
        setColumns(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchColumns();
  }, [boardId, projectId]);

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
            <div key={col.id} style={{ minWidth: "300px" }}>
              <Column 
              column={col} 
              tasks={tasks.filter(t=>t.columnId===col.id)}
              onTaskCreated= {handleTaskCreator }
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