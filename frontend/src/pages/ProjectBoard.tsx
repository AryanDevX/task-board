import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Column } from '../components/Column';
import styles from './ProjectBoard.module.css';

interface TaskData {
  id: string;
  taskName: string;
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

  return (
    <div className={styles.pageContainer}>
      <header style={{ marginBottom: '20px' }}>
        <h1>Viewing Project: {projectId}</h1>
        <p>Drag and Drop is fully operational!</p>
      </header>

      <div className={styles.boardWrapper}>
        {boardData.map((columnData) => (
          <Column
            key={columnData.id}
            columnId={columnData.id}
            title={columnData.title}
            tasks={columnData.tasks}
            onTaskDrop={handleTaskDrop}
          />
        ))}
      </div>
    </div>
  );
};
