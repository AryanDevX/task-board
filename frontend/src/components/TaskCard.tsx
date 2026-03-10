import React from 'react';
import styles from './TaskCard.module.css';

export interface TaskCardProps {
  id: string;
  taskName: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({ id, taskName }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('taskId', id);
    e.dataTransfer.effectAllowed = 'move';
  };
  return (
    <div className={styles.card} draggable={true} onDragStart={handleDragStart}>
      <p className={styles.title}>{taskName}</p>
    </div>
  );
};
