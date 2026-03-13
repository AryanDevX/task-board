import { Router } from 'express';
import { createTask, getTaskById, updateTask, deleteTask } from '../controllers/taskController.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';

const router = Router();

//Creating Task
router.post('/', authenticateJWT, createTask);

//Getting Task 
router.get('/:taskId', authenticateJWT, getTaskById);

//Updating Task
router.put('/:taskId', authenticateJWT, updateTask);

//Deleting Task
router.delete('/:taskId', authenticateJWT, deleteTask);

export default router;