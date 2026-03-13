import { Router } from 'express';
import { createTask, getTaskById, updateTask, deleteTask } from '../controllers/taskController.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { requireProjectRole } from '../middleware/requireProjectRole.js';

const router = Router({mergeParams:true});

//Creating Task
router.post('/', authenticateJWT,requireProjectRole(["PROJECT_ADMIN","PROJECT_MEMBER"]) ,createTask);

//Getting Task 
router.get('/:taskId', authenticateJWT, getTaskById);

//Updating Task
router.put('/:taskId', authenticateJWT, requireProjectRole(["PROJECT_ADMIN","PROJECT_MEMBER"]), updateTask);

//Deleting Task
router.delete('/:taskId', authenticateJWT, requireProjectRole(["PROJECT_ADMIN","PROJECT_MEMBER"]), deleteTask);

export default router;