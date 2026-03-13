import { Router } from 'express';
import { getUserNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';

const router = Router();

router.get('/', authenticateJWT, getUserNotifications);
router.put('/mark-all-read', authenticateJWT, markAllAsRead);
router.put('/:notificationId/read', authenticateJWT, markAsRead);

export default router;