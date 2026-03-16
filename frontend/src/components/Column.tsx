import React from 'react';
import { TaskCard } from './TaskCard';
import styles from './Column.module.css';

export interface TaskData {
  id: string;
  taskName: string;
  description?: string;
  assignedId?: string | null;
}

export interface ColumnProps {
  columnId: string;
  title: string;
  tasks: TaskData[];
  onTaskDrop: (taskId: string, targetColumnId: string) => void;
  onTaskClick: (taskId: string) => void;
}

export const Column: React.FC<ColumnProps> = ({
  columnId,
  title,
  tasks,
  onTaskDrop,
  onTaskClick,
}) => {
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const draggedTaskId = e.dataTransfer.getData('taskId');
    if (draggedTaskId) {
      onTaskDrop(draggedTaskId, columnId);
    }
  };
  return (
    <div
      className={styles.column}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <h3 className={styles.header}>{title}</h3>

      <div className={styles.taskContainer}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            id={task.id}
            taskName={task.taskName}
            onClick={() => onTaskClick}
          />
        ))}
      </div>
    </div>
  );
};
