import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../types/appError.js';

export const createBoard = async (req: Request, res:Response, next:NextFunction): Promise<void> =>{
    try{
        const {title, description} = req.body;
        const {projectId} = req.params;
        if(!title || !projectId){
            return next(new AppError ("Board title and projectId are required.", 400));
        }
        const newBoard = await prisma.board.create({
            data:{
                title,
                projectId: parseInt(projectId),
                columns:{
                    create:[
                        {title: 'To Do', order:0},
                        {title: 'In progress', order:1},
                        {title: 'Review', order:2},
                        {title: 'Done', order:3},
                    ]
                },
            },
            include:{
                columns:true,
            },
        });
        res.status(200).json(newBoard);
    }
    catch(error){
        next(error);
    }
}

export const getBoards = async (req: Request, res:Response, next:NextFunction): Promise<void> =>{
    try{
        const {projectId} = req.params;
        if(!projectId){
            return next(new AppError ("Project ID is required.", 400));
        }
        const boards = await prisma.board.findMany({
            where:{
                id:parseInt(projectId),
            },
            include:{
                columns:{
                    orderBy:{order:'asc'},
                    select:{id:true, title:true},
                }
            },
            orderBy:{id:'asc'},
        });
        res.status(200).json(boards);
    }
    catch(error){
        next(error);
    }
}

export const updateBoard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try{
        const { boardId } = req.params;
        const { title } = req.body;
        if (!title) {
            return next(new AppError("Board title is required.", 400));
        }
        const updatedBoard = await prisma.board.update({
            where: { id: parseInt(boardId) },
            data: { title }
        });

        res.status(200).json(updatedBoard);
    } 
    catch(error){
        next(error);
    }
};

export const deleteBoard = async (req:Request, res:Response, next:NextFunction):Promise<void> => {
    try{
        const { boardId } = req.params;
        await prisma.board.delete({
            where: { id: parseInt(boardId) }
        });
        res.status(200).json({ message: "Board deleted successfully." });
    }
    catch(error){
        next(error);
    }
}
