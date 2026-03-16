import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { type Project } from '../types/models';
import { projectApi } from '../api/project.api';
import styles from './Dashboard.module.css';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    if (!isDropdownOpen) return;
    const closeMenu = () => setIsDropdownOpen(false);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [isDropdownOpen]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await projectApi.getProjects();
        setProjects(data);
      } catch (error) {
        console.error("Failed to load projects", error);
      }
    };
    loadProjects();
  }, []);

  const getInitials = (name: string) => name.substring(0, 1).toUpperCase();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.newProjectBtn}>+ New Project</button>

        <div className={styles.avatarContainer}>
          <button className={styles.avatarCircle} onClick={toggleDropdown}>
            {user?.username ? getInitials(user.username) : 'U'}
          </button>

          {isDropdownOpen && (
            <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownAvatar}>
                  {user?.username ? getInitials(user.username) : 'U'}
                </div>
                <div className={styles.userInfo}>
                  <h3>{user?.username || 'User'}</h3>
                  <p>{user?.email || 'No email set'}</p>
                </div>
              </div>
              <button className={styles.logoutBtn} onClick={handleLogout}>
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      <main>
        <h2>My Projects</h2>
        {projects.length === 0 ? (
          <p>You don't have any projects yet. Click "New Project" to start!</p>
        ) : (
          <div className={styles.projectGrid}>
            {projects.map((project) => (
              <Link key={project.id} to={`/project/${project.id}`} className={styles.projectCard}>
                <h3>{project.name}</h3>
                <p>{project.description || 'No description provided.'}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};