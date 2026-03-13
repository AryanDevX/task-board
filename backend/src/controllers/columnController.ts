import {NextFunction, Request, Response} from 'express';
import {prisma} from '../../lib/prisma.js';
import { AppError } from '../../types/appError';

export const createColumn = async (req: Request, res:Response, next:NextFunction): Promise<void> => {
    try {
        const {title, projectId, order} = req.body;
        if(!title || !projectId){
            return next(new AppError ("Column title and projectID are required.", 400));
        }
        const newColumn = await prisma.column.create({
            data: {
                title: title,
                projectId: projectId,
                order: order || 0,
            },
        });
        res.status(201).json(newColumn);
    }
    catch(error){
        // console.error("Error creating column", error);
        // res.status(500).json({error: "Failed to create column"});
        next(error);
    }
};

export const getColumns = async (req: Request, res:Response, next:NextFunction): Promise<void> =>{
    try{
        const{projectId} = req.params;
        if(!projectId){
            return next(new AppError ("Project ID is required.", 400));
        }
        const columns = await prisma.column.findMany({
            where: {
                projectId: parseInt(projectId),
            },
            orderBy: {
                order: 'asc',
            },
            include:{
                tasks: {
                    orderBy: {
                        order: 'asc',
                    },
                },
            },
        });
        res.status(200).json(columns);
    }
    catch(error){
        // console.error("Error during fetching columns:", error);
        // res.status(500).json({ error: "Failed to fetch columns from the database" });
        next(error);
    }
};

export const updateColumn = async (req: Request, res:Response, next:NextFunction): Promise<void> => {
    try{
        const {columnId} = req.params;
        const {title, order} = req.body;
        if(!columnId){
            return next(new AppError ("Column ID is required.", 400));
        }
        const updatedColumn = await prisma.column.update({
            where: {
                id: parseInt(columnId),
            },
            include:{
                tasks: {
                    orderBy: {
                        order: 'asc',
                    },
                },
            },
            data:{
                title: title,
                order: order,
            },
        });
        res.status(200).json(updatedColumn);
    }
    catch(error){
        // console.error("Error during updating column:", error);
        // res.status(500).json({ error: "Failed to update column from the database" });
        next(error);
    }
};

export const deleteColumn = async (req: Request, res: Response, next:NextFunction): Promise<void> => {
    try{
        const {columnId} = req.params;
        if(!columnId){
            return next(new AppError ("Column ID is required.", 400));
        }
        const deletedColumn = await prisma.column.delete({
            where: {
                id: parseInt(columnId),
            },
        });
        res.status(200).json({message: "Column deleted successfully",deletedColumn});
    }
    catch(error){
        // console.error("Error during deleting column:", error);
        // res.status(500).json({ error: "Failed to delete column from the database" });
        next(error);
    }
};
