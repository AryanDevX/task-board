import { Router } from 'express';
import { getUsers, updateAvatar } from '../controllers/userController.js'; 
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { uploadAvatar } from '../middleware/uploadAvatar.js';

const router = Router();

// When api/users hits, then run the getUsers function
router.get('/', getUsers);
router.patch('/avatars',authenticateJWT,uploadAvatar.single("avatar"),updateAvatar);

export default router;