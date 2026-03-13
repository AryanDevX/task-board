import { Router } from 'express';
import { createComment, updateComment, deleteComment } from '../controllers/commentController.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';

const router = Router();

//Creating Comment
router.post('/', authenticateJWT, createComment);

//Updating Comment
router.put('/:commentId', authenticateJWT, updateComment);

//Deleting colCommentumn
router.delete('/:commentId', authenticateJWT, deleteComment);

export default router;