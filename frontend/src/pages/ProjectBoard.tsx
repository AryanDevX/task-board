import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Column } from '../components/Column';
import {TaskModal, type Task} from '../components/TaskModal';
import styles from './ProjectBoard.module.css';

interface TaskData {
  id: string;
  taskName: string;
  description?:string;
  assignedId?:string | null;
}

interface DummyColumn {
  id: string;
  title: string;
  tasks: TaskData[];
}

const initialBoardData: DummyColumn[] = [
  {
    id: 'col-1',
    title: 'To Do',
    tasks: [
      { id: 'task-1', taskName: 'Design Database Schema' },
      { id: 'task-2', taskName: 'Setup Vite Config' },
    ],
  },
  {
    id: 'col-2',
    title: 'In Progress',
    tasks: [
      { id: 'task-3', taskName: 'Build AuthContext' },
      { id: 'task-4', taskName: 'Create ProjectBoard UI' },
    ],
  },
  {
    id: 'col-3',
    title: 'Review',
    tasks: [{ id: 'task-5', taskName: 'Check strict TypeScript rules' }],
  },
  {
    id: 'col-4',
    title: 'Done',
    tasks: [{ id: 'task-6', taskName: 'Project Initialization' }],
  },
];

export const ProjectBoard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [boardData, setBoardData] = useState<DummyColumn[]>(initialBoardData);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  
  const handleTaskClick = (taskId: string) => {
    for (const column of boardData) {
      const foundTask = column.tasks.find((t) => t.id === taskId);
      if (foundTask) {
        setEditingTask({
          id: foundTask.id,
          taskName: foundTask.taskName,
          description: foundTask.description,
          status: column.title,
          assigneeId:foundTask.assignedId || null
        });
        setIsModalOpen(true);
        return; // Stop searching
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(undefined); // Clear out the form so the next "Add Task" is blank
  };

  const handleTaskDrop = (taskId: string, targetColumnId: string) => {
    setBoardData((prevBoard) => {
      let taskToMove: TaskData | null = null;
      let sourceColumnId = '';
      for (const column of prevBoard) {
        const foundTask = column.tasks.find((t) => t.id == taskId);
        if (foundTask) {
          taskToMove = foundTask;
          sourceColumnId = column.id;
          break;
        }
      }
      if (!taskToMove || sourceColumnId == targetColumnId) {
        return prevBoard;
      }
      return prevBoard.map((Column) => {
        if (Column.id === sourceColumnId) {
          return {
            ...Column,
            tasks: Column.tasks.filter((t) => t.id != taskId),
          };
        }
        if (Column.id === targetColumnId) {
          return {
            ...Column,
            tasks: [...Column.tasks, taskToMove!],
          };
        }
        return Column;
      });
    });
  };

  const handleSaveTask = (newTaskData: Task) => {
    setBoardData((prevBoard) => {
      if(!editingTask){
        const newTask = {...newTaskData, id: 'task-${Date.now()}' };
        return prevBoard.map((column) => {
          if(column.title === newTask.status){
            return{...column, tasks:[...column.tasks, newTask]};
          };
          return column;
        });
      }
      else{
        return prevBoard.map((column)=>{
          if(column.title!==newTaskData.status){
            return {...column, tasks:column.tasks.filter((t)=> t.id!==newTaskData.id )};
          }
          const taskExistsInColumn = column.tasks.some((t) => t.id === newTaskData.id);
          if(taskExistsInColumn){
            return {
              ...column,
              tasks: column.tasks.map((t) => 
                t.id === newTaskData.id ? { ...t, ...newTaskData } : t
              ),
            };
          }
          else{
            return {
              ...column,
              tasks: [...column.tasks, newTaskData],
            };
          }
        });
      }
    });
    handleCloseModal();
  }
  return (
    <div className={styles.pageContainer}>
      <header style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <h1>Viewing Project: {projectId}</h1>
        <button
          onClick={() => {setEditingTask(undefined); setIsModalOpen(true)}}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          + Add New Task
        </button>
        {/* <p>Drag and Drop is fully operational!</p> */}
      </header>

      <div className={styles.boardWrapper}>
        {boardData.map((columnData) => (
          <Column
            key={columnData.id}
            columnId={columnData.id}
            title={columnData.title}
            tasks={columnData.tasks}
            onTaskDrop={handleTaskDrop}
            onTaskClick={handleTaskClick}
          />
        ))}
      </div>
      <TaskModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveTask}
        initialData={editingTask}
      />
    </div>
  );
};
