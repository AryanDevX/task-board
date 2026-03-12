import express from 'express';
import { createProject } from '../controllers/createProjectController.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { getProjects } from '../controllers/getProjects.js';
import { requireProjectRole } from '../middleware/requireProjectRole.js';
import { addMember,deleteMember,updateRole } from '../controllers/manageMembers.js';
const router = express.Router();

router.post('/projects',authenticateJWT ,createProject);
router.get('/projects', authenticateJWT,getProjects);
router.post('/projects/:projectId/members/:userId',authenticateJWT,requireProjectRole(["PROJECT_ADMIN"]),addMember)
router.delete('/projects/:projectId/members/:userId',authenticateJWT,requireProjectRole(["PROJECT_ADMIN"]),deleteMember)
router.patch('/projects/:projectId/members/:userId/role/:role',authenticateJWT,requireProjectRole(["PROJECT_ADMIN"]),updateRole)


export default router;
