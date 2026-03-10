import {prisma} from '../../lib/prisma';
import { Request ,Response } from 'express';
import { getUsername} from '../utils/helpers';

export const createProject= async (req:Request ,res:Response)=>{
    try{
        if(!req.user){return res.status(401).json( {message : "Missing user authentication" })};
        const id=req.user?.userId;
        const { description }=req.body;
        const name= await getUsername(id);

        if(!name){return res.status(401).json({message:"Unauthorized user"});}

        const project = await prisma.project.create({
            data: {
                name,
                description,
                createdBy: { connect: { id:id } }
            }
        });

        return res.status(201).json({message:"Project created successfully",project});
    }
    catch(err){
   
    console.error(err);

    return res.status(500).json({
      message: "Internal server error"
    });

    }
};