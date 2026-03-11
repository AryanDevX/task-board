import React from 'react';
import styles from './TaskCard.module.css';

export interface TaskCardProps {
  id: string;
  taskName: string;
  onClick: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ id, taskName, onClick }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('taskId', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={styles.card} draggable={true} onDragStart={handleDragStart} onClick={onClick} style={{cursor:'pointer'}}>
      <p className={styles.title}>{taskName}</p>
    </div>
  );
};
