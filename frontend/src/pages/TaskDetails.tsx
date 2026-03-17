import { useState } from 'react';
import { type Task } from '../types/models';
import styles from '../pages/TaskDetails.module.css';

interface Props {
  task: Task;
  onClose: () => void;
  onUpdate: (updatedTask: Task) => void;
  onDelete: (taskId: number) => void;
}

export const TaskDetailsModal = ({
  task,
  onClose,
  onUpdate,
  onDelete,
}: Props) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');

  const handleSave = () => {
    onUpdate({ ...task, title, description });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      {/* stopPropagation prevents clicking the modal itself from closing it */}
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          &times;
        </button>

        <label className={styles.label}>Task Title</label>
        <input
          className={styles.titleInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className={styles.label}>Description</label>
        <textarea
          className={styles.descriptionArea}
          placeholder="Add a more detailed description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className={styles.footer}>
          <button
            className={styles.deleteBtn}
            onClick={() => onDelete(task.id)}
          >
            Delete Task
          </button>
          <button className={styles.saveBtn} onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
