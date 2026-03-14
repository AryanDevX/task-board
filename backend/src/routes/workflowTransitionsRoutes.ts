import {Router} from 'express';
import {getTransitions, updateTransitions} from '../controllers/workflowController';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { requireProjectRole } from '../middleware/requireProjectRole.js';

const router = Router();

//Get the transition
router.get('/:boardId/transitions', authenticateJWT,requireProjectRole(["PROJECT_ADMIN","PROJECT_MEMBER"]) ,getTransitions);
//Updating the transitions:
router.put('/:boardId/transitions', authenticateJWT,requireProjectRole(["PROJECT_ADMIN"]) ,updateTransitions);
