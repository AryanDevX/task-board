import React from 'react';
import { useState, useEffect } from 'react';

//Blueprint of task
export interface Task {
  id: string;
  taskName: string;
  description?: string;
  assigneeId: string | null;
  status: string;
}

//Blueprint for modal properties:
export interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Task) => void;
  initialData?: Task;
}

//Main function:
export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [taskName, setTaskName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<string>('To Do');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);

  //For automatically filling the form.
  useEffect(() => {
    if (initialData) {
      setTaskName(initialData.taskName);
      setDescription(initialData.description || '');
      setStatus(initialData.status);
      setAssigneeId(initialData.assigneeId);
    } else {
      setTaskName('');
      setDescription('');
      setStatus('To Do');
      setAssigneeId(null);
    }
  }, [initialData, isOpen]); //If initialData changes or modal open then useEffect will run.

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    //Passing the complete task object to parent board.
    onSave({
      id: initialData ? initialData.id : 'task-${Date.now()}',
      taskName,
      description,
      status,
      assigneeId,
    });
    onClose(); //Close modal after saving.
  };
  //If modal is not open then return nothing.
  if (!isOpen) {
    return null;
  }
  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-content" style={modalStyle}>
        <h2>{initialData ? 'Edit Task' : 'Create New Task'}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <label>Task Name:</label>
            <input
              type="text"
              value={taskName} //For displaying the input value
              onChange={(e) => setTaskName(e.target.value)} //Updating the state
              required
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Description:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', minHeight: '80px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Assignee Id:</label>
            <input
              id="assigneeId"
              type="text"
              value={assigneeId || ''} //For displaying the input value
              onChange={(e) => setAssigneeId(e.target.value)} //Updating the state
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div
            style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}
          >
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit">Save Task</button>
          </div>
        </form>
      </div>
    </div>
  );
};
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};
const modalStyle: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '8px',
  width: '400px',
};
