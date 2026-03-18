import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { boardApi } from "../api/boards.api";
import { type Board } from "../types/models";
import { useNavigate } from "react-router-dom";
import { CreateBoardModal } from "../components/CreateBoardModal";


// TODO: Replace 'any' with your actual Board type from models


export const ProjectBoard = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

const [boards, setBoards] = useState<Board[]>([]);
const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateBoard = (newBoard:Board) => {
  setBoards((prev) => [newBoard, ...prev]);
};

  useEffect(() => {
    if (!projectId) return;

    const fetchBoards = async () => {
      try {
        setLoading(true);
        const data = await boardApi.getBoardsByProject(projectId);
        setBoards(data );
      } catch (err) {
        console.error(err);
        setError("Failed to load boards");
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, [projectId]);

  if (loading) return <p>Loading boards...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Project Boards</h2>
    <button onClick={() => setIsModalOpen(true)}>
      + New Board
    </button>
    
      {boards.length === 0 ? (
        <p>No boards found</p>
      ) : (
        boards.map((board) => (
          <div
            key={board.id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "6px",
              cursor:'pointer'
            }}
            onClick={() => navigate(`/project/${projectId}/boards/${board.id}`)}
          >
            <h3>{board.title}</h3>
            <h5>{board.description} </h5> 
          </div>
        ))
      )}
      {isModalOpen && (
  <CreateBoardModal
    projectId={projectId!}                      // trusting to be not null
    onClose={() => setIsModalOpen(false)}
    onSuccess={handleCreateBoard}
  />
)}
    </div>
  );
};



// import {
//   type FormEvent,
//   type ReactNode,
//   useEffect,
//   useMemo,
//   useState,
// } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { boardApi } from '../api/boards.api';
// import { projectApi } from '../api/project.api';
// import { taskApi } from '../api/tasks.api';
// import { useAuth } from '../context/AuthContext';
// import type {
//   Board,
//   BoardDetails,
//   Priority,
//   Project,
//   Task,
// } from '../types/models';
// import { getAvatarSrc, getInitials } from '../utils/avatar';
// import styles from './ProjectBoard.module.css';

// type StorySummary = Task & {
//   boardTitle: string;
//   columnTitle: string;
// };

// const priorityOptions: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// export const ProjectBoards = () => {
//   const { projectId } = useParams<{ projectId: string }>();
//   const navigate = useNavigate();
//   const { user } = useAuth();

//   const [project, setProject] = useState<Project | null>(null);
//   const [boards, setBoards] = useState<Board[]>([]);
//   const [boardDetails, setBoardDetails] = useState<BoardDetails[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
//   const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

//   const [boardTitle, setBoardTitle] = useState('');
//   const [boardDescription, setBoardDescription] = useState('');
//   const [isCreatingBoard, setIsCreatingBoard] = useState(false);

//   const [storyTitle, setStoryTitle] = useState('');
//   const [storyDescription, setStoryDescription] = useState('');
//   const [storyPriority, setStoryPriority] = useState<Priority>('MEDIUM');
//   const [isCreatingStory, setIsCreatingStory] = useState(false);

//   const stories = useMemo<StorySummary[]>(
//     () =>
//       boardDetails.flatMap((board) =>
//         board.columns.flatMap((column) =>
//           column.tasks
//             .filter((task) => task.issueType === 'STORY')
//             .map((task) => ({
//               ...task,
//               boardTitle: board.title,
//               columnTitle: column.title,
//             })),
//         ),
//       ),
//     [boardDetails],
//   );

//   const storyDestination = useMemo(() => {
//     const boardWithColumns =
//       boardDetails.find((board) => board.columns.length > 0) ?? null;
//     return {
//       board: boardWithColumns,
//       column: boardWithColumns?.columns[0] ?? null,
//     };
//   }, [boardDetails]);

//   const loadProjectBoard = async () => {
//     if (!projectId) {
//       setError('Project not found.');
//       setLoading(false);
//       return;
//     }
//     try {
//       setLoading(true);
//       setError(null);
//       const [projectResponse, projectBoards] = await Promise.all([
//         projectApi.getProject(projectId),
//         boardApi.getBoardsByProject(projectId),
//       ]);

//       const currentProject = projectResponse.projects[0] ?? null;
//       setProject(currentProject);
//       setBoards(projectBoards);

//       const boardDetailResponses = await Promise.all(
//         projectBoards.map((board) =>
//           boardApi.getBoardById(String(board.id), projectId),
//         ),
//       );
//       setBoardDetails(boardDetailResponses);
//     } catch (err) {
//       setError(
//         err instanceof Error ? err.message : 'Failed to load project board.',
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     void loadProjectBoard();
//   }, [projectId]);

//   const handleCreateBoard = async (e: FormEvent) => {
//     e.preventDefault();
//     if (!projectId || !boardTitle.trim()) return;

//     try {
//       setIsCreatingBoard(true);
//       await boardApi.createBoard(projectId, {
//         title: boardTitle.trim(),
//         description: boardDescription.trim() || undefined,
//       });
//       setBoardTitle('');
//       setBoardDescription('');
//       setIsBoardModalOpen(false);
//       await loadProjectBoard();
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Unable to create board.');
//     } finally {
//       setIsCreatingBoard(false);
//     }
//   };

//   const handleCreateStory = async (e: FormEvent) => {
//     e.preventDefault();
//     if (
//       !projectId ||
//       !storyDestination.board ||
//       !storyDestination.column ||
//       !storyTitle.trim()
//     ) {
//       return;
//     }

//     try {
//       setIsCreatingStory(true);
//       await taskApi.createTask(
//         projectId,
//         String(storyDestination.board.id),
//         String(storyDestination.column.id),
//         {
//           title: storyTitle.trim(),
//           description: storyDescription.trim() || undefined,
//           issueType: 'STORY',
//           priority: storyPriority,
//         },
//       );
//       setStoryTitle('');
//       setStoryDescription('');
//       setStoryPriority('MEDIUM');
//       setIsStoryModalOpen(false);
//       await loadProjectBoard();
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Unable to create story.');
//     } finally {
//       setIsCreatingStory(false);
//     }
//   };

//   const avatarSrc = getAvatarSrc(user?.avatar);

//   if (loading) {
//     return <div className={styles.state}>Loading project board...</div>;
//   }

//   if (error) {
//     return <div className={styles.state}>{error}</div>;
//   }

//   return (
//     <div className={styles.page}>
//       <header className={styles.topBar}>
//         <button
//           className={styles.backButton}
//           onClick={() => navigate('/dashboard')}
//         >
//           ← Dashboard
//         </button>
//         <button
//           className={styles.avatarButton}
//           onClick={() => navigate('/profile')}
//         >
//           {avatarSrc ? (
//             <img
//               className={styles.avatarImage}
//               src={avatarSrc}
//               alt={`${user?.username || 'User'} avatar`}
//             />
//           ) : (
//             getInitials(user?.username)
//           )}
//         </button>
//       </header>

//       <section>
//         <h1 className={styles.title}>{project?.name ?? 'Untitled Project'}</h1>
//         <p className={styles.subtitle}>
//           {project?.description ||
//             'Track your project stories and boards from one place.'}
//         </p>
//       </section>

//       <section className={styles.section}>
//         <div className={styles.sectionHeader}>
//           <h2>Stories</h2>
//           <button
//             className={styles.secondaryButton}
//             onClick={() => setIsStoryModalOpen(true)}
//           >
//             Create Story
//           </button>
//         </div>

//         {stories.length === 0 ? (
//           <div className={styles.emptyCard}>
//             No stories yet. Create one to start organizing your work.
//           </div>
//         ) : (
//           <div className={styles.storyGrid}>
//             {stories.map((story) => (
//               <article key={story.id} className={styles.storyCard}>
//                 <div className={styles.storyMeta}>
//                   <span>{story.boardTitle}</span>
//                   <span>{story.columnTitle}</span>
//                 </div>
//                 <h3>{story.title}</h3>
//                 <p>{story.description || 'No description added yet.'}</p>
//                 <p className={styles.metaLine}>
//                   {story.priority} · #{story.id}
//                 </p>
//               </article>
//             ))}
//           </div>
//         )}
//       </section>

//       <section className={styles.section}>
//         <div className={styles.sectionHeader}>
//           <h2>Boards</h2>
//           <button
//             className={styles.secondaryButton}
//             onClick={() => setIsBoardModalOpen(true)}
//           >
//             Create Board
//           </button>
//         </div>

//         {boards.length === 0 ? (
//           <div className={styles.emptyCard}>
//             No boards yet. Create a board to break this project into workflows.
//           </div>
//         ) : (
//           <div className={styles.boardGrid}>
//             {boardDetails.map((board) => {
//               const taskCount = board.columns.reduce(
//                 (total, column) => total + column.tasks.length,
//                 0,
//               );

//               return (
//                 <article key={board.id} className={styles.boardCard}>
//                   <div className={styles.boardCardHeader}>
//                     <div>
//                       <h3>{board.title}</h3>
//                       <p>{board.description || 'No description provided.'}</p>
//                     </div>
//                     <span>{board.columns.length} columns</span>
//                   </div>
//                   <div className={styles.boardStats}>
//                     <span>{taskCount} items</span>
//                     <span>
//                       {board.columns.map((column) => column.title).join(' • ')}
//                     </span>
//                   </div>
//                 </article>
//               );
//             })}
//           </div>
//         )}
//       </section>

//       {isBoardModalOpen && (
//         <ModalShell
//           title="Create Board"
//           onClose={() => setIsBoardModalOpen(false)}
//         >
//           <form className={styles.modalForm} onSubmit={handleCreateBoard}>
//             <label className={styles.inputGroup}>
//               <span>Board name</span>
//               <input
//                 value={boardTitle}
//                 onChange={(e) => setBoardTitle(e.target.value)}
//                 placeholder="Product roadmap"
//                 required
//               />
//             </label>
//             <label className={styles.inputGroup}>
//               <span>Description</span>
//               <textarea
//                 value={boardDescription}
//                 onChange={(e) => setBoardDescription(e.target.value)}
//                 placeholder="What is this board for?"
//                 rows={4}
//               />
//             </label>
//             <button
//               className={styles.primaryButton}
//               type="submit"
//               disabled={isCreatingBoard}
//             >
//               {isCreatingBoard ? 'Creating...' : 'Create Board'}
//             </button>
//           </form>
//         </ModalShell>
//       )}

//       {isStoryModalOpen && (
//         <ModalShell
//           title="Create Story"
//           onClose={() => setIsStoryModalOpen(false)}
//         >
//           <form className={styles.modalForm} onSubmit={handleCreateStory}>
//             <label className={styles.inputGroup}>
//               <span>Story title</span>
//               <input
//                 value={storyTitle}
//                 onChange={(e) => setStoryTitle(e.target.value)}
//                 placeholder="As a user, I can..."
//                 required
//               />
//             </label>
//             <label className={styles.inputGroup}>
//               <span>Description</span>
//               <textarea
//                 value={storyDescription}
//                 onChange={(e) => setStoryDescription(e.target.value)}
//                 placeholder="Describe the story outcome"
//                 rows={4}
//               />
//             </label>
//             <label className={styles.inputGroup}>
//               <span>Priority</span>
//               <select
//                 value={storyPriority}
//                 onChange={(e) => setStoryPriority(e.target.value as Priority)}
//               >
//                 {priorityOptions.map((priority) => (
//                   <option key={priority} value={priority}>
//                     {priority}
//                   </option>
//                 ))}
//               </select>
//             </label>
//             <button
//               className={styles.primaryButton}
//               type="submit"
//               disabled={
//                 isCreatingStory ||
//                 !storyDestination.board ||
//                 !storyDestination.column
//               }
//             >
//               {isCreatingStory ? 'Creating...' : 'Create Story'}
//             </button>
//             <p className={styles.formHint}>
//               {storyDestination.board && storyDestination.column
//                 ? `This story will be created automatically in ${storyDestination.board.title} / ${storyDestination.column.title}.`
//                 : 'Create a board first so the story can be created.'}
//             </p>
//           </form>
//         </ModalShell>
//       )}
//     </div>
//   );
// };

// interface ModalShellProps {
//   children: ReactNode;
//   onClose: () => void;
//   title: string;
// }

// const ModalShell = ({ children, onClose, title }: ModalShellProps) => (
//   <div className={styles.modalOverlay} onClick={onClose}>
//     <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
//       <div className={styles.modalHeader}>
//         <h3>{title}</h3>
//         <button className={styles.closeButton} onClick={onClose} type="button">
//           ×
//         </button>
//       </div>
//       {children}
//     </div>
//   </div>
// );
