import { Router } from 'express';
import { createBoard, getBoards, getBoardDetails, updateBoard, deleteBoard } from '../controllers/boardController.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { requireProjectRole } from '../middleware/requireProjectRole.js';

// mergeParams allows this router to read the :projectId from the parent projectRoutes
const router = Router({mergeParams: true});

// create: Only Admins and Members can create new boards
router.post('/', authenticateJWT, requireProjectRole(["PROJECT_ADMIN", "PROJECT_MEMBER"]),createBoard);

//read list: Viewers, Members, and Admins can see the list of boards
router.get('/', authenticateJWT, requireProjectRole(["PROJECT_ADMIN", "PROJECT_MEMBER", "PROJECT_VIEWER"]),getBoards);

//read single board: Viewers, Members, and Admins can open a specific board
router.get('/:boardId', authenticateJWT, requireProjectRole(["PROJECT_ADMIN", "PROJECT_MEMBER", "PROJECT_VIEWER"]),getBoardDetails);

// update: Only Admins and Members can rename or update the description
router.put('/:boardId', authenticateJWT, requireProjectRole(["PROJECT_ADMIN", "PROJECT_MEMBER"]),updateBoard);

//delete: Only Admins and Members can delete a board
router.delete('/:boardId', authenticateJWT, requireProjectRole(["PROJECT_ADMIN", "PROJECT_MEMBER"]),deleteBoard);

export default router;
