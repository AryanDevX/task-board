import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { boardApi } from '../api/boards.api';
import { type Board } from '../types/models';
import { CreateBoardModal } from '../components/CreateBoardModal';
import { NotificationCenter } from '../components/Notification';
import styles from './ProjectBoard.module.css';
import sharedStyles from '../styles/index.module.css';

export const ProjectBoard = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateBoard = (newBoard: Board) => {
    setBoards((prev) => [newBoard, ...prev]);
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (!projectId) return;

    const fetchBoards = async () => {
      try {
        setLoading(true);
        const data = await boardApi.getBoardsByProject(projectId);
        setBoards(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load boards');
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, [projectId]);

  if (loading) return <div className={styles.state}>Loading boards...</div>;
  if (error) return <div className={styles.state}>{error}</div>;

  return (
    <div className={`${sharedStyles.pageShell} ${styles.page}`}>
      <header className={sharedStyles.pageTopBar}>
        <button
          className={sharedStyles.backButton}
          onClick={() => navigate('/dashboard')}
        >
          ← Dashboard
        </button>
        <NotificationCenter />
      </header>

      <section className={sharedStyles.pageSplitHeader}>
        <div className={sharedStyles.pageTitleBlock}>
          <h1 className={sharedStyles.pageTitle}>Project Boards</h1>
          <p className={sharedStyles.pageSubtitle}>
            Manage and organize your team workflows.
          </p>
        </div>
        <button
          className={sharedStyles.primaryButton}
          onClick={() => setIsModalOpen(true)}
        >
          + New Board
        </button>
      </section>

      <div className={styles.section}>
        {boards.length === 0 ? (
          <div className={styles.emptyCard}>
            No boards found. Create a new board to get started.
          </div>
        ) : (
          <div className={styles.boardGrid}>
            {boards.map((board) => (
              <article
                key={board.id}
                className={`${styles.boardCard} ${styles.clickableCard}`}
                onClick={() =>
                  navigate(`/project/${projectId}/boards/${board.id}`)
                }
              >
                <div className={styles.boardCardHeader}>
                  <h3>{board.title}</h3>
                </div>
                <p>{board.description || 'No description provided.'}</p>
              </article>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <CreateBoardModal
          projectId={projectId!}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleCreateBoard}
        />
      )}
    </div>
  );
};
