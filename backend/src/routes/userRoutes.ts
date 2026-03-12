import { Router } from 'express';
import { getUsers } from '../controllers/userController.js'; 

const router = Router();

// When api/users hits, then run the getUsers function
router.get('/', getUsers);

export default router;