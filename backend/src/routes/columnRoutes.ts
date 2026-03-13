import { Router } from 'express';
import { createColumn, getColumns, updateColumn, deleteColumn } from '../controllers/columnController.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { requireProjectRole } from '../middleware/requireProjectRole.js';

const router = Router();

//Creating column
router.post('/', authenticateJWT,  requireProjectRole(["PROJECT_ADMIN"]),createColumn);

//Getting columns 
router.get('/project/:projectId', authenticateJWT, getColumns);

//Updating column
router.put('/:columnId', authenticateJWT,  requireProjectRole(["PROJECT_ADMIN"]), updateColumn);

//Deleting column
router.delete('/:columnId', authenticateJWT, requireProjectRole(["PROJECT_ADMIN"]),deleteColumn);

export default router;