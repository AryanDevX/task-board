import {NextFunction, Request, Response} from 'express';
import {prisma} from '../../lib/prisma.js';
import { request } from 'http';

export const createComment = async (req: Request, res:Response, next:NextFunction): Promise<void> => {
    try {
        const {content, taskId} = req.body;
        const authorId = (req as any).user.id;
        if(!content || !taskId){
            res.status(400).json({error: "Task ID and content are required."});
            return;
        }
        const newComment = await prisma.comment.create({
            data: {
                content,
                taskId: parseInt(taskId),
                authorId: parseInt(authorId),
            },
            include: {
                author: { select: { id: true, username: true, avatar: true } }
            }
        });
        const task = await prisma.task.findUnique({
            where: { id: parseInt(taskId) },
            select: { assigneeId: true, title: true }
        });
        if(!task){
            res.status(400).json({ error: "A task is required in the db." });
            return;
        }
        if (task.assigneeId && task.assigneeId !== authorId) {
            await prisma.notification.create({
                data: {
                    userId: task.assigneeId, 
                    taskId: parseInt(taskId),
                    type: 'COMMENT_ADDED',
                    message: `Someone added a new comment to your task.`,
                }
            });
        }
        res.status(201).json(newComment);
    }
    catch(error){
        next(error);
    }
};

export const updateComment = async (req:Request, res:Response, next:NextFunction): Promise<void> => {
    try{
        const {commentId} = req.params;
        const {content} = req.body;
        const userId = (req as any).user.id;
        if(!content){
            res.status(400).json({error: 'Content is required.'});
            return;
        }
        const existingComment = await prisma.comment.findUnique({
            where: { id: parseInt(commentId) }
        });
        if (!existingComment) {
            res.status(404).json({error: "Comment not found."});
            return;
        }
        if (existingComment.authorId !== parseInt(userId)) {
            res.status(403).json({error: "Unauthorized: You can only edit your own comments." });
            return;
        }
        const updatedComment = await prisma.comment.update({
            where: {id: parseInt(commentId)},
            data: {content},
        });

        res.status(200).json(updatedComment);
    } 
    catch(error) {
        next(error);
    }
}

export const deleteComment = async (req:Request, res:Response, next:NextFunction): Promise<void> =>{
    try {
        const {commentId} = req.params;
        const userId = (req as any).user.id;
        const existingComment = await prisma.comment.findUnique({
            where: { id: parseInt(commentId) }
        });
        if (!existingComment) {
            res.status(404).json({ error: "Comment not found." });
            return;
        }
        if (existingComment.authorId !== parseInt(userId)) {
            res.status(403).json({ error: "Unauthorized: You can only delete your own comments." });
            return;
        }
        const deletedComment = await prisma.comment.delete({
            where: {
                id:parseInt(commentId),
            },
        });
        res.status(200).json({message: "Comment deleted successfully",deletedComment});
    } 
    catch(error) {
        next(error);
    }
}