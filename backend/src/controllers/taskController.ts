import { NextFunction, Request, Response } from 'express';
import {prisma} from '../../lib/prisma.js';

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
        if(!taskId){
            res.status(400).json({error: 'Task ID is required.'});
            return;
        }
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
        const updatedTask = await prisma.task.update({
            where: { id: parseInt(taskId) },
            data: {
                // Prisma Magic: If any of these are `undefined` in req.body, 
                // Prisma simply ignores them and keeps the old database value!
                title: title,
                description: description,
                columnId: columnId ? parseInt(columnId) : undefined,
                assigneeId: assigneeId !== undefined ? parsedAssigneeId : undefined,
                priority: priority,
            }
        });

        // 2. FETCH OLD DATA: Before we change anything, we must fetch the current 
        //    task from the database. We need to know what it looked like so we can 
        //    compare the old values to the new values for the Audit Trail.
        
        // 3. WORKFLOW GUARD: If the req.body includes a new columnId (meaning they 
        //    are dragging it to a new status), check the WorkflowTransition table. 
        //    If the move is illegal, reject the request (400 Bad Request).
        
        // 4. EXECUTE: Update the task in Prisma with the new data.
        
        // 5. AUDIT LOGS: 
        //    - If the columnId changed, create a "STATUS_CHANGE" log.
        //    - If the assigneeId changed, create an "ASSIGNEE_CHANGE" log.

    } catch (error) {
        next(error);
    }
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const {taskId} = req.params;
        // 1. EXTRACT: Pull the taskId from the URL.
        
        // 2. EXECUTE: Tell Prisma to delete it. (Because we used onDelete: Cascade 
        //    in the schema, Prisma will automatically wipe out all its comments 
        //    and audit logs so we don't have to!)
        
        // 3. RESPOND: Send back a 200 success message.
    } catch (error) {
        // Handle error
    }
};