import {Router} from 'express';
import {getTransitions, updateTransitions} from '../controllers/workflowController';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { requireProjectRole } from '../middleware/requireProjectRole.js';

const router = Router({mergeParams:true});

//Get the transition
router.get('/', authenticateJWT,requireProjectRole(["PROJECT_ADMIN"]) ,getTransitions);
//Updating the transitions:
router.put('/', authenticateJWT,requireProjectRole(["PROJECT_ADMIN"]) ,updateTransitions);

export default router;