import express from 'express';
import { createProject } from '../controllers/createProjectController';
import { authenticateJWT } from '../middleware/authenticateJWT';
import { getProjects } from '../controllers/getProjects';
import { requireProjectRole } from '../middleware/requireProjectRole';
import { addMember,deleteMember,updateRole } from '../controllers/manageMembers';
const router = express.Router();

router.post('/projects',authenticateJWT ,createProject);
router.get('/projects', authenticateJWT,getProjects);
router.post('/projects/:projectId/members/:userId',authenticateJWT,requireProjectRole(["PROJECT_ADMIN"]),addMember)
router.delete('/projects/:projectId/members/:userId',authenticateJWT,requireProjectRole(["PROJECT_ADMIN"]),deleteMember)
router.patch('/projects/:projectId/members/:userId/role/:role',authenticateJWT,requireProjectRole(["PROJECT_ADMIN"]),updateRole)


export default router;