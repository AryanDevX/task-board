import { prisma } from '../../lib/prisma';
import { Request, Response } from 'express';

export const getProjects = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    if (!req.user) {
      return res.status(401).json({ message: "Missing user authentication" });
    }

    let projects;
    if (!projectId) {
      projects = await prisma.projectMembership.findMany({
        where: { userId: req.user.userId },
        include: { project: true }, 
      });
    } else {
      projects = await prisma.projectMembership.findMany({
        where: {
          userId: req.user.userId,
          projectId: Number(projectId), 
        },
        include: { project: true },
      });
    }

    return res.status(200).json({ projects });
  } catch (err) {
    console.error("Error fetching projects:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};