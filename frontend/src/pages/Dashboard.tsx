import * as React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useState } from 'react';
import { CreateProjectModal } from '../components/CreateProjectModal.tsx';

export const Dashboard = () => {
  const { user, dispatch } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const handleCreateProject = (projectName: string) => {
    console.log('Creating new project: ', projectName);
    //ROHIT: Actually create a project using api.
    setIsModalOpen(false);
  };
  return (
    <div>
      <div>
        <h1>Project Dashboard</h1>
        <p>
          Welcome, {user?.name || 'Guest'}! ({user?.role})
        </p>
        <button onClick={() => dispatch({ type: 'LOGOUT' })}>Log Out</button>
      </div>
      {user?.role == 'Global Admin' && (
        <div>
          <h3>Admin Control</h3>
          <button onClick={() => setIsModalOpen(true)}>
            + Create New Project
          </button>
        </div>
      )}
      <section>
        <h2>Your Projects</h2>
        <div>
          <div>
            <h3>Example Project TASK-BOARD</h3>
            <p>2 Active Boards</p>
          </div>
        </div>
      </section>

      {isModalOpen && (
        <CreateProjectModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateProject}
        />
      )}
    </div>
  );
};
