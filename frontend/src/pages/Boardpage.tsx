import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { columnApi } from "../api/column.api";
import { type Column as Columntype } from "../types/models";
import Column from "./Column";
import styles from '../styles/index.module.css';
import { CreateColumnModal } from "../components/CreateColumnModal";
import type {  Task, WorkflowTransition } from "../types/models";
import { taskApi } from "../api/tasks.api";
import { apiFetch } from "../api/client";
import { WorkflowSettingsModal } from "../components/WorkflowSettingsModal";

export const BoardPage = () => {
  const navigate = useNavigate();
  const { boardId, projectId } = useParams<{ projectId: string, boardId: string; }>();
  const [addModal ,SetAddModal]= useState(false);
   const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Columntype[]>([]);
  const [transitions, setTransitions] = useState<WorkflowTransition[]>([]);
  const [loading, setLoading] = useState(false);
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);

  const handleColumnCreator= (col:Columntype)=>{
    setColumns((prev)=>[...prev,col]);
    SetAddModal(false);
  }

  const handleTaskCreator= (task:Task)=>{
    setTasks((prev) => {
      const newTasksState = [...prev, task];

      //  update the parent story's column based on its new children's statuses
      if (task.parentId) {
        const parentId = task.parentId;
        const parentIndex = newTasksState.findIndex((t) => t.id === parentId);

        if (parentIndex !== -1) {
          const parent = newTasksState[parentIndex];
          const children = newTasksState.filter((t) => t.parentId === parentId);

          if (children.length > 0) {
            const childStatuses = children.map((c) => {
              const col = columns.find((col) => col.id === c.columnId);
              return (col as any)?.status || 'TODO';
            });

            const allDone = childStatuses.every((s) => s === 'DONE');
            const allTodo = childStatuses.every((s) => s === 'TODO');

            const targetStatus = allDone ? 'DONE' : allTodo ? 'TODO' : 'IN_PROGRESS';
            const derivedColumn = columns.find((col) => (col as any)?.status === targetStatus) || columns[0];

            if (derivedColumn && parent.columnId !== derivedColumn.id) {
              newTasksState[parentIndex] = { ...parent, columnId: derivedColumn.id };
            }
          }
        }
      }

      return newTasksState;
    });
  }

  const handleColumnUpdate = (updatedCol: Columntype) => {
    setColumns(prev => prev.map(c => c.id === updatedCol.id ? updatedCol : c));
  }; 

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
    );
  };

const handleTaskMove = async (taskId: string, sourceColumnId: string, targetColumnId: string, newOrder: number) => {
  
  // Prevent invalid status transitions according to the board's workflow
  if (sourceColumnId !== targetColumnId) {
    const isValidTransition = transitions.some(
      (t) => String(t.fromColumnId) === sourceColumnId && String(t.toColumnId) === targetColumnId
    );
    if (!isValidTransition) {
      alert("Invalid workflow transition. Moving to this column is not permitted.");
      return;
    }
  }

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

  //  UI Update (updates local state instantly)
  setTasks(prev => {
    const taskToMove = prev.find(t => String(t.id) === taskId);
    if (!taskToMove) return prev;

    const otherTasks = prev.filter(t => String(t.id) !== taskId);
    const modifiedTask = { ...taskToMove, columnId: Number(targetColumnId) };

    const targetColTasks = otherTasks
      .filter(t => String(t.columnId) === targetColumnId)
      .sort((a, b) => a.order - b.order);

    // Insert the dragged task into the calculated visual index
    targetColTasks.splice(newOrder, 0, modifiedTask);
    const finalizedTarget = targetColTasks.map((t, idx) => ({ ...t, order: idx }));
    const nonTargetTasks = otherTasks.filter(t => String(t.columnId) !== targetColumnId);

    let newTasksState: Task[] = [];
    if (sourceColumnId !== targetColumnId) {
      const sourceColTasks = nonTargetTasks
        .filter(t => String(t.columnId) === sourceColumnId)
        .sort((a, b) => a.order - b.order)
        .map((t, idx) => ({ ...t, order: idx })); // Resequence source column
      const rest = nonTargetTasks.filter(t => String(t.columnId) !== sourceColumnId);
      newTasksState = [...rest, ...sourceColTasks, ...finalizedTarget];
    } else {
      newTasksState = [...nonTargetTasks, ...finalizedTarget];
    }

    //  update the parent story's column based on its children's statuses
    if (modifiedTask.parentId) {
      const parentId = modifiedTask.parentId;
      const parentIndex = newTasksState.findIndex(t => t.id === parentId);
      
      if (parentIndex !== -1) {
        const parent = newTasksState[parentIndex];
        const children = newTasksState.filter(t => t.parentId === parentId);
        
        if (children.length > 0) {
          const childStatuses = children.map(c => {
            const col = columns.find(col => col.id === c.columnId);
            return (col as any)?.status || 'TODO';
          });
          
          const allDone = childStatuses.every(s => s === 'DONE');
          const allTodo = childStatuses.every(s => s === 'TODO');
          
          const targetStatus = allDone ? 'DONE' : (allTodo ? 'TODO' : 'IN_PROGRESS');
          const derivedColumn = columns.find(col => (col as any)?.status === targetStatus) || columns[0];
          
          if (derivedColumn && parent.columnId !== derivedColumn.id) {
            newTasksState[parentIndex] = { ...parent, columnId: derivedColumn.id };
          }
        }
      }
    }

    return newTasksState;
  });

  try {
    // Sync with backend
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
  }
};

const handleColumnMove = async (columnId: string, newOrder: number) => {
  const draggedCol = columns.find(c => String(c.id) === columnId);
  if (!draggedCol || draggedCol.order === newOrder) return;

  setColumns(prev => {
    const sorted = [...prev].sort((a, b) => a.order - b.order);
    const oldIndex = sorted.findIndex(c => String(c.id) === columnId);
    if (oldIndex === -1) return prev;
    
    let targetIndex = sorted.findIndex(c => c.order === newOrder);
    
    const [removed] = sorted.splice(oldIndex, 1);
    if (targetIndex === -1) targetIndex = sorted.length; // If dropped at the far end
    
    sorted.splice(targetIndex, 0, removed);
    return sorted.map((c, i) => ({ ...c, order: i })); // Reset indices sequentially
  });

  try {
    await apiFetch(`/projects/${projectId}/boards/${boardId}/columns/${columnId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: newOrder })
    });
  } catch (error) {
    console.error("Failed to move column:", error);
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
    
    const transData = await apiFetch<WorkflowTransition[]>(`/projects/${projectId}/boards/${boardId}/workflows`);
    setTransitions(transData);
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
    setTransitions((prev) => 
      prev.filter((t) => String(t.fromColumnId) !== columnId && String(t.toColumnId) !== columnId)
    );
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
           <button 
             className={styles.secondaryButton}
             onClick={() => setWorkflowModalOpen(true)}
           >
             Workflow Settings
           </button>
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
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const dataStr = e.dataTransfer.getData("text/plain");
          if (!dataStr) return;
          try {
            const data = JSON.parse(dataStr);
            if (data.type === "column") {
              handleColumnMove(data.columnId, columns.length);
            }
          } catch (err) {
            console.error(err);
          }
        }}
      >
        {columns.length === 0 ? (
          <div className={styles.emptyCard}>
            No columns defined for this board yet.
          </div>
        ) : (
          [...columns].sort((a, b) => a.order - b.order).map((col) => (
            <div key={col.id} style={{ minWidth: "300px" }} >
              <Column 
              column={col} 
              tasks={tasks.filter(t=>t.columnId===col.id)}
              allTasks={tasks}
              onTaskCreated= {handleTaskCreator }
              onTaskMove={handleTaskMove}
               onTaskUpdated={handleTaskUpdated}
              onTaskDelete={handleTaskDelete}
              onColumnDelete={handleColumnDelete}
              onColumnMove={handleColumnMove}
              onColumnUpdate={handleColumnUpdate}
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

      {workflowModalOpen && (
        <WorkflowSettingsModal
          projectId={projectId!}
          boardId={boardId!}
          columns={columns}
          transitions={transitions}
          onClose={() => setWorkflowModalOpen(false)}
          onUpdate={(newTransitions) => setTransitions(newTransitions)}
        />
      )}
    </div>
  );
};
