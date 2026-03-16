import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectApi } from '../api/project.api';
import { type Project } from '../types/models';
import styles from './ProjectBoard.module.css';

export const ProjectBoard = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectId) return;
      try {
        const data = await projectApi.getProject(projectId);
        setProject(data);
      } catch (error) {
        console.error("Failed to load project", error);
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadProjectData();
  }, [projectId, navigate]);

  if (isLoading) return <div className={styles.container}>Loading board...</div>;
  if (!project) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{project.name}</h1>
        <button onClick={() => navigate('/dashboard')} className={styles.addTaskBtn} style={{width: 'auto', padding: '0.5rem 1rem'}}>
          Back to Dashboard
        </button>
      </header>

      <main className={styles.board}>
        {['To Do', 'In Progress', 'Done'].map(columnName => (
          <div key={columnName} className={styles.column}>
            <h3>
              {columnName}
              <span>0</span>
            </h3>
            
            <div className={styles.taskList}>
              <div className={styles.taskCard}>
                Example Task: Fix the Login Page
              </div>
            </div>

            <button className={styles.addTaskBtn}>+ Add Task</button>
          </div>
        ))}
      </main>
    </div>
  );
};
