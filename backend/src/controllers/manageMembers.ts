import { ProjectRole } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { Request, Response } from 'express';

export const addMember = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Missing user authentication" });
    }

    const projectId = parseInt(req.params.projectId);
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId to add" });
    }
    //check if user exists
    const user = await prisma.user.findUnique({
      where: { id:parseInt(userId) },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id:projectId },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is already a member
    const existingMembership = await prisma.projectMembership.findUnique({
      where: {
        userId_projectId: {
          userId:user.id,projectId:project.id
        },
      },
    });

    if (existingMembership) {
      return res.status(400).json({ message: "User is already a member of this project" });
    }

    // Add user as a PROJECT_VIEWER
    const membership = await prisma.projectMembership.create({
      data: {
        userId:user.id,
        projectId:project.id,
        role: "PROJECT_VIEWER",
      },
    });

    return res.status(201).json({ message: "Member added successfully", membership });
  } catch (err) {
    console.error("Error adding member:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteMember = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Missing user authentication" });
    }

    const projectId = parseInt(req.params.projectId);
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId to remove" });
    }

    const user = await prisma.user.findUnique({
      where: { id:parseInt(userId) },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const project = await prisma.project.findUnique({
      where: { id:projectId },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
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
      return res.status(400).json({ message: "User is not a member of this project" });
    }

    await prisma.projectMembership.delete({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId: project.id,
        },
      },
    });

    return res.status(200).json({ message: "Member removed successfully" });
  } catch (err) {
    console.error("Error removing member:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateRole =  async (req:Request,res:Response)=>{
     try {

         const validRoles = Object.values(ProjectRole); 
        const incomingRole = req.params.role; 

        if (!validRoles.includes(incomingRole as ProjectRole)) {
        return res.status(400).json({ error: "Invalid role" });
}

        const newRole: ProjectRole = incomingRole as ProjectRole;

    if (!req.user) {
      return res.status(401).json({ message: "Missing user authentication" });
    }

    const projectId = parseInt(req.params.projectId);
    const username  = req.params.username;

    if (!username) {
      return res.status(400).json({ message: "Missing username to update" });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const project = await prisma.project.findUnique({
      where: { id:projectId },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const membership = await prisma.projectMembership.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId: project.id
        },
      },
    });

    if (!membership) {
      return res.status(400).json({ message: "User is not a member of this project" });
    }

 await prisma.projectMembership.update({
  where: {
    userId_projectId: {
      userId: user.id,
      projectId: project.id
    },
  },
  data: {
    role: newRole
  },
});

      return res.status(200).json({ message: "Member Role updated successfully" });
  } catch (err) {
    console.error("Error updating  member:", err);
    return res.status(500).json({ message: "Internal server error" });
  }

};
