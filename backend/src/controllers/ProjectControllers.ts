import { prisma } from '../../lib/prisma.js';
import { NextFunction, Request, Response } from 'express';
import { getUsername } from '../utils/helpers.js';
import { AppError } from '../../types/appError.js';

//GET /projects/:projectId

export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id =req.params.userId;
    if (!id) {
      return next(new AppError('Missing user authentication', 401));
    }
    const userId = parseInt(id);
    const { projectname,description } = req.body;
    const project = await prisma.project.create({
      data: {
        name:projectname,
        description,
        createdBy: { connect: { id: userId } },
      },
    });

    await prisma.projectMembership.create({
      data: {
        userId,
        projectId: project.id,
        role: 'PROJECT_ADMIN',
      },
    });

    return res
      .status(201)
      .json({ message: 'Project created successfully', project });
  } catch (err) {
    next(err);
  }
};

export const updateProject = 
   async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId= parseInt(req.params.projectId);
      const {description, projectname}=req.body;
      const project = await prisma.project.findUnique({
        where: { id: projectId, archived: false },
      });
      if(!projectname) {
        return next(new AppError('name cannot be null',400));
      }
      if (!project) {
        return next(new AppError('project not found', 404));
      }

     return  await prisma.project.update({
        where: { id: projectId },
        data: { name:projectname,description },
      });
    } catch (err) {
      next(err);
    }
  };


export const getProjects = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const projectId = req.params.projectId;
    const id =req.params.userId;
    if (!id) {
      return next(new AppError('Missing user authentication', 401));
    }
    const userId= parseInt(id);

    let projects;
    if (!projectId) {
      // fetches archived and non archived together
      projects = await prisma.projectMembership.findMany({
        where: { userId  },
        include: { project: true },
      });
    } else {
      projects = await prisma.projectMembership.findMany({
        where: {
          userId,
          projectId: Number(projectId),
        },
        include: { project: true },
      });
    }

    return res.status(200).json({ projects });
  } catch (err) {
    next(err);
  }
};

export const projectArchive = 
   async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId= req.params.projectId;
      const project = await prisma.project.findUnique({
        where: { id: parseInt(projectId) },
      });

      if (!project) {
        return next(new AppError('project not found', 404));
      }

      if (project?.archived === true) {
        return next(new AppError('Project already archived', 409));
      }

      await prisma.project.update({
        where: { id: parseInt(projectId) },
        data: { archived: true, archivedAt: new Date() },
      });

      return res.status(201).json({message:"Archived successfully"});
    } catch (err) {
      next(err);
    }
  };

