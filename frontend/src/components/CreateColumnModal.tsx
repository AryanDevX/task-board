import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { columnApi } from '../api/column.api';
import { type Column } from '../types/models';
import styles from '../pages/ProjectBoard.module.css';
import {type  CreateColumnDTO } from '../types/dtos';

interface CreateColumnModalProps {
    projectId:string ,
    nextOrder?: number;
  onClose: () => void;
  onSuccess: (newColumn: Column) => void;
}


export const CreateColumnModal = ({projectId, nextOrder = 0, onClose, onSuccess }: CreateColumnModalProps) => {
  const { boardId } = useParams<{ boardId: string  }>();
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('TODO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wipLimit, setWipLimit]= useState<string>();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !boardId) return;

    const data = {
      title: title.trim(), 
      order: nextOrder,
      wipLimit: wipLimit ? Number(wipLimit) : undefined,
      status
    } as CreateColumnDTO;

    try {
      setIsSubmitting(true);
      setError(null);

      // Assuming your API takes boardId and the column data
      const newColumn = await columnApi.createColumn(projectId , boardId, data);

      onSuccess(newColumn); // This updates the list and closes the modal in the parent
    } catch (err) {
      setError('Failed to create column. Please try again  (Maybe Order is already occupied)');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        className={styles.modalCard} 
        onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside the form
      >
        <div className={styles.modalHeader}>
          <h3>Add New Column</h3>
          <button className={styles.closeButton} onClick={onClose} type="button">
            ×
          </button>
        </div>

        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
    <label htmlFor="title">Column Title</label>
    <input
      id="title"
      type="text"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      placeholder="e.g. Done"
      required
    />
  </div>

  <div className={styles.inputGroup}>
    <label htmlFor="status">Status Mapping</label>
    <select
      id="status"
      value={status}
      onChange={(e) => setStatus(e.target.value)}
      required
    >
      <option value="TODO">To Do</option>
      <option value="IN_PROGRESS">In Progress</option>
      <option value="IN_REVIEW">In Review</option>
      <option value="DONE">Done</option>
    </select>
  </div>

  {/* WIP Limit - Number Input */}
  <div>
    <label htmlFor="wipLimit">WIP Limit (Optional)</label>
    <input
      id="wipLimit"
      type="number"
      min="1"
      value={wipLimit}
      onChange={(e) => setWipLimit(e.target.value)}
      placeholder="No limit"
    />
  </div>

          {error && <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button 
              type="button" 
              className={styles.secondaryButton} 
              onClick={onClose}
              style={{ flex: 1, background: '#f3f4f6', color: '#374151' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.primaryButton} 
              disabled={isSubmitting || !title.trim()}
              style={{ flex: 2 }}
            >
              {isSubmitting ? 'Adding...' : 'Add Column'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};