import { ProjectRole } from '../../types/roles';
import { prisma } from '../../lib/prisma.js';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../types/appError';
import app from '../app';

export const addMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('Missing user authentication', 401));
    }

    const projectId = parseInt(req.params.projectId);
    const userId = req.params.id;

    if (!userId) {
      return next(new AppError('Missing userId to add', 400));
    }
    //check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Check if user is already a member
    const existingMembership = await prisma.projectMembership.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId: project.id,
        },
      },
    });

    if (existingMembership) {
      return next(
        new AppError('User is already a member of this project', 400),
      );
    }

    const DEFAULT_ROLE: ProjectRole = 'PROJECT_VIEWER';

    // Add user as a PROJECT_VIEWER
    const membership = await prisma.projectMembership.create({
      data: {
        userId: user.id,
        projectId: project.id,
        role: DEFAULT_ROLE,
      },
    });

    res.status(201).json({ message: 'Member added successfully', membership });
  } catch (err) {
    next(err);
  }
};

export const deleteMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('Missing user authentication', 401));
    }

    const projectId = parseInt(req.params.projectId);
    const userId = req.params.id;

    if (!userId) {
      return next(new AppError('Missing userId to remove', 400));
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const membership = await prisma.projectMembership.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId: project.id,
        },
      },
    });

    if (!membership) {
      return next(new AppError('User is not a member of this project', 400));
    }

    await prisma.projectMembership.delete({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId: project.id,
        },
      },
    });

    res.status(200).json({ message: 'Member removed successfully' });
  } catch (err) {
    next(err);
  }
};

export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validRoles: ProjectRole[] = [
      'PROJECT_VIEWER',
      'PROJECT_ADMIN',
      'PROJECT_MEMBER',
    ];
    const incomingRole = req.params.role;

    if (!validRoles.includes(incomingRole as ProjectRole)) {
      res.status(400).json({ error: 'Invalid role' });
    }

    const newRole: ProjectRole = incomingRole as ProjectRole;

    if (!req.user) {
      return next(new AppError('Missing user authentication', 401));
    }

    const projectId = parseInt(req.params.projectId);
    const username = req.params.username;

    if (!username) {
      return next(new AppError('Missing userId to update', 400));
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const membership = await prisma.projectMembership.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId: project.id,
        },
      },
    });

    if (!membership) {
      return next(new AppError('User is not a member of this project', 400));
    }

    await prisma.projectMembership.update({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId: project.id,
        },
      },
      data: {
        role: newRole,
      },
    });

    res.status(200).json({ message: 'Member Role updated successfully' });
  } catch (err) {
    next(err);
  }
};
