import { NextFunction, Request, Response } from 'express';
import {prisma} from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';

export const createTask = async (req: Request, res: Response, next:NextFunction): Promise<void> => {
    try {
        const {title, columnId, description, order, issueType, priority, assigneeId, parentId, dueDate} = req.body;
        const reporterId = (req as any).user.id; //Getting the reporterId from jwt middleware.
        if(!title || !columnId){
            res.status(400).json({ error: "Task title and columnId are required." });
            return;
        }
        if (parentId) {
            const parent = await prisma.task.findUnique({ where: { id: parseInt(parentId) } });
            if (!parent || parent.issueType !== 'STORY') {
                res.status(400).json({ error: "A task can only be a child of a STORY." });
                return;
            }
        }
        const newTask = await prisma.task.create({
            data:{
                title: title,
                columnId: parseInt(columnId),
                reporterId: parseInt(reporterId),
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
                userId: parseInt(reporterId),
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
            res.status(400).json({error: 'Task ID is required.'});
            return;
        }
        const task = await prisma.task.findUnique({
            where: {
                id:parseInt(taskId),
            },
            include:{
                comments:true,
                reporter:{select:{id:true, username:true, avatar:true}},
                auditLogs:{orderBy: {
                    createdAt:'desc',
                }},
                assignee:{select:{id:true, username:true, avatar:true}},
                children:true,
            }
        });
        if(!task){
            res.status(404).json({ error: "Task not found" });
            return;
        }
        res.status(201).json(task);
    }
     catch (error) {
        next(error);
    }
};

export const updateTask = async (req: Request, res: Response, next:NextFunction): Promise<void> => {
    try {
        const {taskId} = req.params;
        const { title, description, columnId, assigneeId, priority } = req.body;
        const userId = (req as any).user.id;
        const oldTask = await prisma.task.findUnique({
            where: { id: parseInt(taskId) },
            select: {
                columnId: true,
                assigneeId: true,
                priority: true, 
            }
        });
        
        if (!oldTask) {
            res.status(404).json({ error: "Task not found." });
            return;
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
                res.status(400).json({ error: "Invalid status transition. You cannot move the task there." });
                return; 
            }
            await prisma.auditLog.create({
                data: {
                    taskId: parseInt(taskId),
                    userId: parseInt(userId), 
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
                userId: parseInt(userId),
                type: 'ASSIGNEE_CHANGE',
                oldValue: oldTask.assigneeId ? oldTask.assigneeId.toString() : "Unassigned",
                newValue: parsedAssigneeId ? parsedAssigneeId.toString() : "Unassigned"
            });
        }
        if (priority && oldTask.priority !== priority) {
            auditLogsData.push({
                taskId: parseInt(taskId),
                userId: parseInt(userId),
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
            res.status(400).json({error: 'Task ID is required.'});
            return;
        }
        const deletedTask = await prisma.task.delete({
            where: {
                id:parseInt(taskId),
            },
        });
        res.status(200).json({message: "Task deleted successfully",deletedTask});
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ error: "Task not found." });
        } else {
            next(error); 
        }
    }
};