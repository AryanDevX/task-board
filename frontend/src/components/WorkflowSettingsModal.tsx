import  { useState } from 'react';
import { type Column, type WorkflowTransition } from '../types/models';
import { apiFetch } from '../api/client';
import styles from '../pages/ProjectBoard.module.css';

interface Props {
  projectId: string;
  boardId: string;
  columns: Column[];
  transitions: WorkflowTransition[];
  onClose: () => void;
  onUpdate: (transitions: WorkflowTransition[]) => void;
}

export const WorkflowSettingsModal = ({ projectId, boardId, columns, transitions, onClose, onUpdate }: Props) => {
  const [fromCol, setFromCol] = useState<string>(columns[0]?.id ? String(columns[0].id) : '');
  const [toCol, setToCol] = useState<string>(columns[1]?.id ? String(columns[1].id) : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getColumnName = (id: number) => columns.find((c) => c.id === id)?.title || 'Unknown Column';

  const handleAdd = async () => {
    if (!fromCol || !toCol) return;
    
    // Check if transition already exists locally
    if (transitions.some(t => String(t.fromColumnId) === fromCol && String(t.toColumnId) === toCol)) {
      alert('This transition is already allowed.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newTransition = await apiFetch<WorkflowTransition>(`/projects/${projectId}/boards/${boardId}/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromColumnId: Number(fromCol), toColumnId: Number(toCol) }),
      });
      onUpdate([...transitions, newTransition]);
    } catch (error) {
      console.error('Failed to add transition', error);
      alert('Permission Denied: Only Project Admins can modify workflow transitions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (transitionId: number) => {
    try {
      await apiFetch(`/projects/${projectId}/boards/${boardId}/workflows/${transitionId}`, {
        method: 'DELETE',
      });
      onUpdate(transitions.filter(t => t.id !== transitionId));
    } catch (error) {
      console.error('Failed to delete transition', error);
      alert('Permission Denied: Only Project Admins can modify workflow transitions.');
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '100%' }}>
        <div className={styles.modalHeader}>
          <h3>Workflow Transitions</h3>
          <button className={styles.closeButton} type="button" onClick={onClose}>×</button>
        </div>
        
        <div style={{ marginTop: '1rem' }}>
          <p className={styles.formHint}>Define allowed task movements between columns.</p>
          
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
            {transitions.map(t => (
              <li key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #e5e7eb', alignItems: 'center' }}>
                <span style={{ fontWeight: 500 }}>{getColumnName(t.fromColumnId)} <span style={{ color: '#9ca3af', margin: '0 0.5rem' }}>→</span> {getColumnName(t.toColumnId)}</span>
                <button onClick={() => handleDelete(t.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Remove</button>
              </li>
            ))}
            {transitions.length === 0 && <li style={{ color: '#6b7280', fontSize: '0.9rem' }}>No transitions defined yet.</li>}
          </ul>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', alignItems: 'flex-end', background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label>From</label>
              <select value={fromCol} onChange={e => setFromCol(e.target.value)}>{columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
            </div>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label>To</label>
              <select value={toCol} onChange={e => setToCol(e.target.value)}>{columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
            </div>
            <button onClick={handleAdd} disabled={isSubmitting} className={styles.primaryButton} style={{ padding: '0.8rem 1rem' }}>
              {isSubmitting ? '...' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};