import { NextFunction, Request, Response } from 'express';
import {prisma} from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';
import { AppError } from '../../types/appError';

export const createTask = async (req: Request, res: Response, next:NextFunction): Promise<void> => {
    try {
        const {title, columnId, description, order, issueType, priority, assigneeId, parentId, dueDate} = req.body;
        if(!req.user || !req.user.userId ){
            return next(new AppError ('Unauthorized', 401));
        }
        const reporterId = req.user.userId;
        if(!title || !columnId){
            return next(new AppError ("Task title and columnId are required.", 400));
        }
        if(parentId) {
            const parent = await prisma.task.findUnique({ where: { id: parseInt(parentId) } });
            if (!parent || parent.issueType !== 'STORY') {
                return next(new AppError ("A task can only be a child of a STORY.", 400));
            }
            if(issueType==='STORY'){
                return next(new AppError("A STORY cannot be a child of another STORY.", 400));
            }
        }
        const newTask = await prisma.task.create({
            data:{
                title: title,
                columnId: parseInt(columnId),
                reporterId: reporterId,
                description: description || null,
                issueType: issueType || 'TASK',
                priority: priority || 'MEDIUM',
                order: order || 0,
                assigneeId: assigneeId ? parseInt(assigneeId) : null,
                parentId: parentId ? parseInt(parentId) : null,
                dueDate: dueDate ? new Date(dueDate) : null,
            },
        });
        await prisma.auditLog.create({
            data:{
                taskId: newTask.id,
                userId: reporterId,
                type:'TASK_CREATED',
            }
        });
        res.status(201).json(newTask);
    } 
    catch (error) {
        next(error);
    }
};

export const getTaskById = async (req: Request, res: Response, next:NextFunction): Promise<void> => {
    try {
        const {taskId} = req.params;
        if(!taskId){
            return next(new AppError ("Task ID is required.", 400));
        }
        const task = await prisma.task.findUnique({
            where: {
                id:parseInt(taskId),
            },
            include:{
                reporter:{select:{id:true, username:true, avatar:true}},
                assignee:{select:{id:true, username:true, avatar:true}},
                children:true,
                comments:{
                    include: { author: { select: { id: true, username: true, avatar: true } } },
                },
                auditLogs: { 
                    include: { user: { select: { id: true, username: true, avatar: true } } }
                }
            }
        });
        if(!task){
            return next(new AppError ("Task not found", 404));
        }
        const commentActivities = task.comments.map(comment => ({
            ActivityType: 'COMMENT' as const,
            timestamp: comment.createdAt,
            data: comment
        }));
        const auditActivities = task.auditLogs.map(log => ({
            ActivityType: 'AUDIT_LOG' as const,
            timestamp: log.createdAt,
            data: log
        }));
        const mergedTimeline = [...commentActivities, ...auditActivities];
        mergedTimeline.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
        const { comments, auditLogs, ...taskDetails } = task;
        res.status(200).json({
            ...taskDetails,
            activityTimeline: mergedTimeline
        });
    }
     catch (error) {
        next(error);
    }
};

export const updateTask = async (req: Request, res: Response, next:NextFunction): Promise<void> => {
    try {
        const {taskId} = req.params;
        const { title, description, columnId, assigneeId, priority } = req.body;
        if(!req.user || !req.user.userId){
            return next(new AppError ('Unauthorized', 401));
        }
        const userId = req.user.userId;
        const oldTask = await prisma.task.findUnique({
            where: { id: parseInt(taskId) },
            select: {
                columnId: true,
                assigneeId: true,
                priority: true,
                issueType:true, 
            }
        });
        
        if (!oldTask) {
            return next(new AppError ("Task not found.", 404));
        }
        if(oldTask.issueType === 'STORY' && columnId && oldTask.columnId !== parseInt(columnId)) {
            const children = await prisma.task.findMany({ where:{ parentId:parseInt(taskId)}});
            if(children.length > 0) {
                const allChildrenMatch = children.every(c => c.columnId === parseInt(columnId));
                if (!allChildrenMatch) {
                    return next(new AppError("Story status must be consistent. Move all child tasks/bugs to this column first.", 400));
                }
            }
        }
        const auditLogsData: any[] = [];
        if (columnId && oldTask.columnId !== parseInt(columnId)) {
            const allowedTransition = await prisma.workflowTransition.findFirst({
                where: {
                    fromColumnId: oldTask.columnId,
                    toColumnId: parseInt(columnId),
                }
            });
            if (!allowedTransition) {
                return next(new AppError ("Invalid status transition. You cannot move the task there.", 400));
            }
            await prisma.auditLog.create({
                data: {
                    taskId: parseInt(taskId),
                    userId: userId, 
                    type: 'STATUS_CHANGE',
                    oldValue: oldTask.columnId.toString(),
                    newValue: columnId.toString(),
                }
            });
        }

        const parsedAssigneeId = assigneeId ? parseInt(assigneeId) : null;
        if (assigneeId !== undefined && oldTask.assigneeId !== parsedAssigneeId) {
            auditLogsData.push({
                taskId: parseInt(taskId),
                userId: userId,
                type: 'ASSIGNEE_CHANGE',
                oldValue: oldTask.assigneeId ? oldTask.assigneeId.toString() : "Unassigned",
                newValue: parsedAssigneeId ? parsedAssigneeId.toString() : "Unassigned"
            });
        }
        if (priority && oldTask.priority !== priority) {
            auditLogsData.push({
                taskId: parseInt(taskId),
                userId: userId,
                type: 'PRIORITY_CHANGE',
                oldValue: oldTask.priority,
                newValue: priority
            });
        }

        const updatedTask = await prisma.task.update({
            where: { id: parseInt(taskId) },
            data: {
                title: title,
                description: description,
                columnId: columnId ? parseInt(columnId) : undefined,
                assigneeId: assigneeId !== undefined ? parsedAssigneeId : undefined,
                priority: priority,
            }
        });
        if (auditLogsData.length > 0) {
            await prisma.auditLog.createMany({
                data: auditLogsData
            });
        }
        res.status(200).json(updatedTask)
    }
     catch (error) {
        next(error);
    }
};

export const deleteTask = async (req: Request, res: Response, next:NextFunction): Promise<void> => {
    try {
        const {taskId} = req.params;
        if(!taskId){
            return next(new AppError ("Task ID is required.", 400));
        }
        const deletedTask = await prisma.task.delete({
            where: {
                id:parseInt(taskId),
            },
        });
        res.status(200).json({message: "Task deleted successfully",deletedTask});
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return next(new AppError ("Task not found.", 404));
        } else {
            next(error); 
        }
    }
};

export const moveTask = async (req:Request, res: Response, next: NextFunction): Promise<void>=>{
    try{
        const {taskId} = req.params;
        const {targetColumnId, newOrder} = req.body;
        const targetColumn = await prisma.column.findUnique({
            where:{
                id:parseInt(targetColumnId),
            },
        });
        if(!targetColumn){
            return next(new AppError("Target column not found.", 404));
        }
        if(targetColumn.wipLimit!==null){
            const currentTaskCount = await prisma.task.count({
                where: { columnId: parseInt(targetColumnId) }
            });
            if (currentTaskCount >= targetColumn.wipLimit) {
                return next(new AppError(`WIP Limit Reached: The '${targetColumn.title}' column cannot accept more than ${targetColumn.wipLimit} tasks.`, 400));
            }
            const updatedTask = await prisma.task.update({
                where: { id: parseInt(taskId) },
                data: { 
                    columnId: parseInt(targetColumnId),
                    order: parseFloat(newOrder) 
                }
            });
        }
        res.status(200).json(updateTask);
    }
    catch(error){
        next(error);
    }
}