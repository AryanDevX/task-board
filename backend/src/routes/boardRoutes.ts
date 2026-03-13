import { Router } from 'express';
import { createBoard, getBoards, updateBoard, deleteBoard } from '../controllers/boardController.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { requireProjectRole } from '../middleware/requireProjectRole.js';

const router = Router();

//Creating board
router.post('/', authenticateJWT,  requireProjectRole(["PROJECT_ADMIN"]),createBoard);

//Getting boards
router.get('/project/:projectId', authenticateJWT, getBoards);

//Updating board
router.put('/:boardId', authenticateJWT,  requireProjectRole(["PROJECT_ADMIN"]), updateBoard);

//Deleting board
router.delete('/:boardId', authenticateJWT, requireProjectRole(["PROJECT_ADMIN"]),deleteBoard);

export default router;