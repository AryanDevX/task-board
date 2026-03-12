import {prisma} from '../../lib/prisma.js';
import { NextFunction, Request ,Response } from 'express';
import { getUsername} from '../utils/helpers.js';
import { AppError } from '../../types/appError.js';

//GET /projects/:projectId

export const createProject= async (req:Request ,res:Response,next:NextFunction)=>{
    try{
        if(!req.user){return  next(new AppError("Missing user authentication" ,401)); }
        const id=req.user?.userId;
        const { description }=req.body;
        const name= await getUsername(id);

        if(!name){return next(new AppError("Unauthorized user",401)); }

        const project = await prisma.project.create({
            data: {
                name,
                description,
                createdBy: { connect: { id:id } }
            }
        });

        await prisma.projectMembership.create({
            data:{
                userId:id,
                projectId:project.id,
                role:"PROJECT_ADMIN"
            }
        });

        return res.status(201).json({message:"Project created successfully",project});
    }
    catch(err){
   next(err);
    }
};

export const projectnameChange =(name:string, projectId:number)=>{
    return  async (req:Request,res:Response,next:NextFunction) =>{
try{
   await prisma.project.update({
    where:{id:projectId},                               // Only be Called for Valid ProjectIds 
    data:{name}
   });
}
catch(err){
   next(err);
}
};
};


export const projectchangeDescp =(description:string, projectId:number)=>{return  async(req:Request,res:Response,next:NextFunction) =>{
try{
   await prisma.project.update({
    where:{id:projectId},
    data:{description}
   });
}
catch(err){
    next(err);
}
};
};

export const getProjects = async (req: Request, res: Response,next:NextFunction) => {
  try {
    const projectId = req.params.projectId;
    if (!req.user) {
      return next(new AppError("Missing user authentication", 401));
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
    next(err);
  }
};




