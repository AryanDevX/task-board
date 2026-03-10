import React, { useState } from 'react';

export interface CreateProjectModalProps {
  onClose: () => void;
  onSubmit: (projectName: string) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  onClose,
  onSubmit,
}) => {
  const [projectName, setProjectName] = useState<string>('');
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = projectName.trim();
    if (trimmedName) {
      onSubmit(trimmedName);
      // Reset input after submission
      setProjectName('');
    }
  };
  const handleOverLayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    //Clicked outside the MODAL
    if (e.target == e.currentTarget) {
      onClose();
    }
  };
  return (
    <div style={styles.modal}>
      <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Create New Project</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="projectName"
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
            }}
          >
            Project Name
          </label>
          <input
            id="projectName"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Create Task Board"
            autoFocus
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div
          style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}
        >
          <button type="button" onClick={onClose} style={styles.cancelBtn}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={!projectName.trim()}
            style={styles.submitBtn}
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

//Have to move to css modules.
const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#ffffff',
    padding: '2rem',
    borderRadius: '8px',
    width: '400px',
    maxWidth: '90%',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  cancelBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};
