import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { type Project } from '../types/models';
import { projectApi } from '../api/project.api';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { NotificationCenter } from '../components/Notification';
import { getAvatarSrc, getInitials } from '../utils/avatar';
import { EditProjectModal } from '../components/EditProjectModal';
import { ManageUsersModal } from '../components/ManageUsersModal';
import styles from './Dashboard.module.css';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isManageUsersOpen, setIsManageUsersOpen] = useState(false);
  
  const isGlobalAdmin = () => {
    if(!user) return false;
    else if(user.globalRole==='GLOBAL_ADMIN') return true;
    else return false;
  }
  const isAdmin = (project:Project) => {
    if(isGlobalAdmin()) return true;
    if(project.userRole === 'PROJECT_ADMIN') return true;
    else return false;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCreateProject = async (newProject: Project) => {
    setProjects((prevProjects) => [newProject, ...prevProjects]);
  };

  const handleUpdateSuccess = (updatedProject: Project) => {
    setProjects((prevProjects) =>
      prevProjects.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
  };

  const handleArchieveProject = async (projectId: string | number)=>{
    try{
      await projectApi.archiveProject(String(projectId));
      setProjects((prevProjects) => prevProjects.filter((project) => project.id !== projectId));
    }
    catch(error){
      console.error('Failed to archieve project', error);
      alert('Failed to archieve project. Please try again later.');
    }
  }

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await projectApi.getProjects();
        const activeProjects = data.projects.filter((p: Project) => !p.archived);
        setProjects(activeProjects);
      } 
      catch(error){
        console.error('Failed to load projects', error);
      }
    };
    loadProjects();
  }, []);

  const avatarSrc = getAvatarSrc(user?.avatar);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        {isGlobalAdmin() && (
          <div className={styles.adminActions}>
            <button
              className={styles.newProjectBtn}
              onClick={() => setIsModalOpen(true)}
            >
              + New Project
            </button>  
            <button
              className={styles.newProjectBtn} 
              onClick={() => setIsManageUsersOpen(true)}
            >
              Manage Users
            </button>
          </div>
          
        )}
        <div className={styles.actions}>
          <NotificationCenter />
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
              <div key={project.id} className={styles.projectCardWrapper}>
                <Link
                  to={`/project/${project.id}`}
                  className={styles.projectCard}
                >
                  <h3>{project.name}</h3>
                </Link>
                <p className={styles.projectDesc}>{project.description || 'No description provided.'}</p>
                <div className={styles.projectMeta}>
                  <p>Created: {new Date(project.createdAt).toLocaleDateString()}</p>
                  <p>Updated: {new Date(project.updatedAt).toLocaleDateString()}</p>
                </div>
                {isAdmin(project) && (
                  <div className={styles.cardActions}>
                    <button
                      onClick={() => setEditingProject(project)}
                      className={styles.editBtn}
                    >
                      Update
                    </button>
                  <button
                    onClick={() => handleArchieveProject(project.id)}
                    className={styles.archieveBtn}
                  >
                    Archive
                  </button>
                </div>
                )}
              </div>
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
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSuccess={handleUpdateSuccess}
        />
      )}
      {isManageUsersOpen && (
        <ManageUsersModal 
          onClose={() => setIsManageUsersOpen(false)} 
        />
      )}
    </div>
  );
};