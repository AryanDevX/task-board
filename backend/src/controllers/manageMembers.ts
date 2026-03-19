import { ProjectRole } from '../../types/roles.js';
import { prisma } from '../../lib/prisma.js';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../types/appError.js';

const validRoles: ProjectRole[] = ['PROJECT_VIEWER', 'PROJECT_ADMIN', 'PROJECT_MEMBER'];

export const getMembers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try{
    const projectId = parseInt(req.params.projectId);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if(!project){
      return next(new AppError('Project not found', 404));
    }

    const members = await prisma.projectMembership.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
      orderBy: {
        user: {
          email: 'asc',
        },
      },
    });

    res.status(200).json({
      members: members.map((member) => ({
        id: member.id,
        userId: member.userId,
        projectId: member.projectId,
        role: member.role,
        email: member.user.email,
        username: member.user.username,
      })),
    });
  }
  catch (err){
    next(err);
  }
};

export const addMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try{
    
    const projectId = parseInt(req.params.projectId);
    const email = req.params.email;
    const role = req.body.role;

    if(!email){
      return next(new AppError('Missing userId to add', 400));
    }
    //check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if(!user){
      return next(new AppError('User not found', 404));
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if(!project){
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

    if(existingMembership){
      return next(
        new AppError('User is already a member of this project', 400),
      );
    }

    const finalRole = validRoles.includes(role as ProjectRole) ? (role as ProjectRole) : 'PROJECT_VIEWER';
    if(finalRole === 'PROJECT_ADMIN' && req.user?.globalRole !== 'GLOBAL_ADMIN') {
      return next(new AppError('Only Global Admins can assign the Project Admin role.', 403));
    }

    const membership = await prisma.projectMembership.create({
      data: {
        userId: user.id,
        projectId: project.id,
        role: finalRole,
      },
    });

    res.status(201).json({ message: 'Member added successfully', membership });
  }
  catch (err){
    next(err);
  }
};

export const deleteMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try{
    const projectId = parseInt(req.params.projectId);
    const email = req.params.email;

    if(!email){
      return next(new AppError('Missing userId to remove', 400));
    }

    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if(!user){
      return next(new AppError('User not found', 404));
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if(!project){
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

    if(!membership){
      return next(new AppError('User is not a member of this project', 400));
    }

    if(membership.role == 'PROJECT_ADMIN'){
      return next(new AppError('User is an ADMIN of this project.', 400));
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
  }
  catch (err){
    next(err);
  }
};

export const updateMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try{
    const incomingRole = req.body.role;

    if(!validRoles.includes(incomingRole as ProjectRole)){
      res.status(400).json({ error: 'Invalid role' });
    }

    const newRole: ProjectRole = incomingRole as ProjectRole;

    if (newRole === 'PROJECT_ADMIN' && req.user?.globalRole !== 'GLOBAL_ADMIN') {
      return next(new AppError('Only Global Admins can assign the Project Admin role.', 403));
    }

    
    const projectId = parseInt(req.params.projectId);
    const email = req.params.email;

    if(!email){
      return next(new AppError('Missing userId to update', 400));
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if(!user){
      return next(new AppError('User not found', 404));
    }

    if(user.globalRole==='GLOBAL_ADMIN'){
      return next(new AppError('Can\'t change role of ADMIN', 404));
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if(!project){
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

    if(!membership){
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
  }
  catch (err){
    next(err);
  }
};
