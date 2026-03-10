import { NextFunction, Request, Response } from 'express';
import {prisma} from '../../lib/prisma';


export const requireProjectRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    const projectId = parseInt(req.params.projectId);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const membership = await prisma.projectMembership.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ message: "Not part of project" });
    }

    if (!allowedRoles.includes(membership.role) && (req.user?.globalRole!="GLOBAL_ADMIN")) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
};