import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { type Project } from '../types/models';
import { projectApi } from '../api/project.api';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { getAvatarSrc, getInitials } from '../utils/avatar';
import styles from './Dashboard.module.css';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCreateProject = async (newProject: Project) => {
    setProjects((prevProjects) => [newProject, ...prevProjects]);
  };

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await projectApi.getProjects();
        setProjects(data.projects);
      } catch (error) {
        console.error('Failed to load projects', error);
      }
    };
    loadProjects();
  }, []);

  const avatarSrc = getAvatarSrc(user?.avatar);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button
          className={styles.newProjectBtn}
          onClick={() => setIsModalOpen(true)}
        >
          + New Project
        </button>

        <div className={styles.actions}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Log out
          </button>
          <button
            className={styles.avatarCircle}
            onClick={() => navigate('/profile')}
          >
            {avatarSrc ? (
              <img
                className={styles.avatarImage}
                src={avatarSrc}
                alt={`${user?.username || 'User'} avatar`}
              />
            ) : (
              getInitials(user?.username)
            )}
          </button>
        </div>
      </header>

      <main>
        <h2>My Projects</h2>
        {projects.length === 0 ? (
          <p>You don't have any projects yet. Click "New Project" to start!</p>
        ) : (
          <div className={styles.projectGrid}>
            {projects.map((project) => (
              <>
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className={styles.projectCard}
              >
                <h3>{project.name}</h3>
              </Link>
              <p >{project.description || 'No description provided.'}</p>
              </>
            ))}
          </div>
        )}
      </main>
      {isModalOpen && (
        <CreateProjectModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleCreateProject}
        />
      )}
    </div>
  );
};
