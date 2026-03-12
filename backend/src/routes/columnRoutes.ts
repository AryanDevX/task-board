import { Router } from 'express';
import { createColumn, getColumns, updateColumn, deleteColumn } from '../controllers/columnController.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';

const router = Router();

//Creating column
router.post('/', authenticateJWT, createColumn);

//Getting columns 
router.get('/project/:projectId', authenticateJWT, getColumns);

//Updating column
router.put('/:columnId', authenticateJWT, updateColumn);

//Deleting column
router.delete('/:columnId', authenticateJWT, deleteColumn);

export default router;