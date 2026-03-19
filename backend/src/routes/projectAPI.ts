import express, { Router } from 'express';
import {
  createProject,
  getProjects,
  projectArchive,
  updateProject,
} from '../controllers/ProjectControllers.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { requireProjectRole } from '../middleware/requireProjectRole.js';
import {
  addMember,
  deleteMember,
  getMembers,
  updateMember,
} from '../controllers/manageMembers.js';
const router = express.Router();

router.patch('/projects/:projectId',authenticateJWT,requireProjectRole(["PROJECT_ADMIN"]), updateProject)
router.post('/projects/', authenticateJWT, createProject);
router.get('/projects/:projectId', authenticateJWT, getProjects);
router.get('/projects', authenticateJWT, getProjects);
router.get(
  '/projects/:projectId/members',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN']),
  getMembers,
);
router.post('/projects/:projectId/archive',authenticateJWT,requireProjectRole(["PROJECT_ADMIN"]),projectArchive)
router.post(
  '/projects/:projectId/members/:email',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN']),
  addMember,
);
router.delete(
  '/projects/:projectId/members/:email',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN']),
  deleteMember,
);
router.patch(
  '/projects/:projectId/members/:email/',
  authenticateJWT,
  requireProjectRole(['PROJECT_ADMIN']),
  updateMember,
);

export default router;
