import {NextFunction, Request, Response} from 'express';
import {prisma} from '../../lib/prisma.js';
import { AppError } from '../../types/appError';

export const createColumn = async (req: Request, res:Response, next:NextFunction): Promise<void> => {
    try {
        const {title, order} = req.body;
        const {boardId} = req.params;
        if(!title || !boardId){
            return next(new AppError ("Column title and boardId are required.", 400));
        }

        const newColumn = await prisma.column.create({
            data: {
                title: title,
                boardId: parseInt(boardId),
                order: order || 0,
            },
        });
        res.status(201).json(newColumn);
    }
    catch(error){
        next(error);
    }
};

export const getColumns = async (req: Request, res:Response, next:NextFunction): Promise<void> =>{
    try{
        const{boardId} = req.params;
        if(!boardId){
            return next(new AppError ("Project ID is required.", 400));
        }
        const columns = await prisma.column.findMany({
            where: {
                boardId: parseInt(boardId),
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
        next(error);
    }
};
