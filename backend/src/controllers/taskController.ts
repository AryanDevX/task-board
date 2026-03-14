import { NextFunction, Request, Response } from 'express';
import {prisma} from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';
import { AppError } from '../../types/appError';

const enforceWipLimit = async (columnId: number): Promise<void> => {
    const column = await prisma.column.findUnique({ where: { id: columnId } });
    if(!column) return;

    if(column.wipLimit !== null){
        const currentTaskCount = await prisma.task.count({ where: { columnId } });
        if (currentTaskCount >= column.wipLimit) {
            throw new AppError(`WIP Limit Reached: The '${column.title}' column cannot accept more than ${column.wipLimit} tasks.`, 400);
        }
    }
};

const validateAssigneeMembership = async (assigneeId: number, columnId: number): Promise<void> => {
    const column = await prisma.column.findUnique({
        where: { id: columnId },
        include: { board: { select: { projectId: true } } }
    });
    if(!column) throw new AppError("Target column not found.", 404);
    const membership = await prisma.projectMembership.findUnique({
        where: {
            userId_projectId:{
                projectId:column.board.projectId,
                userId: assigneeId,
            }
        }
    });

    if (!membership) {
        throw new AppError("Validation Error: You cannot assign a task to a user who is not a member of this project.", 400);
    }
};

const syncStoryStatus = async (storyId: number, userId: number): Promise<void> => {
    const story = await prisma.task.findUnique({
        where: { id: storyId },
        include: { 
            children: true,
            column: { 
                include: { 
                    board: { 
                        include: { 
                            columns: { orderBy: { order: 'asc' } } 
                        } 
                    } 
                } 
            }
        }
    });

    if(!story || story.issueType !== 'STORY' || story.children.length === 0)return;
    const boardColumns = story.column.board.columns;
    if(boardColumns.length === 0)return;
    const colIndexMap = new Map(boardColumns.map((col, index) => [col.id, index]));
    const childIndices = story.children.map(c => colIndexMap.get(c.columnId) ?? 0);
    const minChildIndex = Math.min(...childIndices);
    const maxChildIndex = Math.max(...childIndices);
    const allInSameColumn = minChildIndex === maxChildIndex;
    let derivedColumnId = story.columnId;
    if(allInSameColumn){
        derivedColumnId = boardColumns[minChildIndex].id;
    } 
    else if(minChildIndex === boardColumns.length - 1){
        derivedColumnId = boardColumns[boardColumns.length - 1].id;
    } 
    else if(maxChildIndex === 0){
        derivedColumnId = boardColumns[0].id;
    } 
    else {
        //mixed state (Work has started but not finished)
        // We place it in the first active working column, regardless of what it is named.
        const firstActiveColIndex = boardColumns.length > 1 ? 1 : 0;
        derivedColumnId = boardColumns[firstActiveColIndex].id;
    }
    if(story.columnId !== derivedColumnId){
        const isFinalColumn = derivedColumnId === boardColumns[boardColumns.length - 1].id;
        await prisma.task.update({
            where:{
                id:storyId 
            },
            data:{
                columnId: derivedColumnId,
                resolvedAt:isFinalColumn?new Date():null,
                closedAt:isFinalColumn?new Date():null,
            }
        });

        await prisma.auditLog.create({
            data: {
                taskId: storyId,
                userId: userId,
                type: 'STATUS_CHANGE',
                oldValue: story.columnId.toString(),
                newValue: derivedColumnId.toString()
            }
        });
    }
};

//Creating a new task:
export const createTask = async (req: Request, res: Response, next:NextFunction): Promise<void> => {
    try {
        const {title, columnId, description, order, issueType, priority, assigneeId, parentId, dueDate} = req.body;
        //Checking reporterId:
        if(!req.user || !req.user.userId ){
            return next(new AppError ('Unauthorized', 401));
        }
        const reporterId = req.user.userId;
        //Checking title & columnId
        if(!title || !columnId){
            return next(new AppError ("Task title and columnId are required.", 400));
        }
        //If a child of another task:
        if(parentId){
            const parent = await prisma.task.findUnique({ where: { id: parseInt(parentId) } });
            if (!parent || parent.issueType !== 'STORY') {
                return next(new AppError ("A task can only be a child of a STORY.", 400));
            }
            if(issueType==='STORY'){
                return next(new AppError("A STORY cannot be a child of another STORY.", 400));
            }
        }
        await enforceWipLimit(parseInt(columnId));
        if (assigneeId) {
            await validateAssigneeMembership(parseInt(assigneeId), parseInt(columnId));
        }
        //New Task creation in database:
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
        //Creating audit log:
        await prisma.auditLog.create({
            data:{
                taskId: newTask.id,
                userId: reporterId,
                type:'TASK_CREATED',
            }
        });
        if(newTask.parentId){
            await syncStoryStatus(newTask.parentId, reporterId);
        }
        res.status(201).json(newTask);
    } 
    catch (error) {
        next(error);
    }
};

export const getTask = async (req: Request, res: Response, next:NextFunction): Promise<void> => {
    try {
        //Retrieving taskid from parameters:
        const {taskId} = req.params;
        if(!taskId){
            return next(new AppError ("Task ID is required.", 400));
        }
        //Getting task data:
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

        //Fetching comments and audit activites and then sorting them to display to user:
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
        const {title, description, columnId, assigneeId, priority, dueDate, issueType, parentId} = req.body;
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
                parentId:true,
                title:true,
                reporterId:true,
            }
        });
        
        if (!oldTask) {
            return next(new AppError ("Task not found.", 404));
        }
        if(oldTask.issueType === 'STORY' && columnId && oldTask.columnId !== parseInt(columnId)) {
            return next(new AppError("A Story cannot be directly moved across columns. Its status updates automatically when its child tasks are moved.", 400));
        }
        const auditLogsData: any[] = [];
        if(columnId && oldTask.columnId !== parseInt(columnId)){
            const allowedTransition = await prisma.workflowTransition.findFirst({
                where: {
                    fromColumnId: oldTask.columnId,
                    toColumnId: parseInt(columnId),
                }
            });
            if(!allowedTransition){
                return next(new AppError("Invalid status transition.", 400));
            }
            await enforceWipLimit(parseInt(columnId));
            
            auditLogsData.push({
                taskId: parseInt(taskId),
                userId: userId, 
                type: 'STATUS_CHANGE',
                oldValue: oldTask.columnId.toString(),
                newValue: columnId.toString(),
            });

            const usersToNotify = new Set<number>();
            if(oldTask.assigneeId && oldTask.assigneeId !== userId) usersToNotify.add(oldTask.assigneeId);
            if(oldTask.reporterId && oldTask.reporterId !== userId) usersToNotify.add(oldTask.reporterId);

            const statusNotifications = Array.from(usersToNotify).map(targetUserId => ({
                userId: targetUserId,
                taskId: parseInt(taskId),
                type: 'STATUS_CHANGED' as const,
                message: `The status of "${oldTask.title}" was updated.`
            }));

            if (statusNotifications.length > 0) {
                await prisma.notification.createMany({ data: statusNotifications });
            }
        }

        const parsedAssigneeId = assigneeId !== undefined ? (assigneeId ? parseInt(assigneeId) : null) : undefined;        
        if(assigneeId !== undefined && oldTask.assigneeId !== parsedAssigneeId){
            if(typeof parsedAssigneeId === 'number'){
                const targetColId = columnId ? parseInt(columnId) : oldTask.columnId;
                await validateAssigneeMembership(parsedAssigneeId, targetColId);
            }
            // assignee change Audit Log
            auditLogsData.push({
                taskId: parseInt(taskId),
                userId: userId,
                type: 'ASSIGNEE_CHANGE',
                oldValue: oldTask.assigneeId ? oldTask.assigneeId.toString() : "Unassigned",
                newValue: parsedAssigneeId ? parsedAssigneeId.toString() : "Unassigned"
            });
            //task assigned notification
            if(typeof parsedAssigneeId === 'number' && parsedAssigneeId !== userId){
                await prisma.notification.create({
                    data: {
                        userId: parsedAssigneeId,
                        taskId: parseInt(taskId),
                        type: 'TASK_ASSIGNED',
                        message: `You were assigned to: "${oldTask.title}"`
                    }
                });
            }
        }
        if(priority && oldTask.priority !== priority){
            auditLogsData.push({
                taskId: parseInt(taskId),
                userId: userId,
                type: 'PRIORITY_CHANGE',
                oldValue: oldTask.priority,
                newValue: priority
            });
        }
        
        let resolvedAtUpdate: Date | null | undefined = undefined;
        let closedAtUpdate: Date | null | undefined = undefined;
        if(columnId && oldTask.columnId !== parseInt(columnId)){
            const targetColumn = await prisma.column.findUnique({
                where: { id: parseInt(columnId) },
                include: { board: { include: { columns: { orderBy: { order: 'asc' } } } } }
            });
            if(targetColumn && targetColumn.board.columns.length > 0){
                const boardColumns = targetColumn.board.columns;
                const lastColumn = boardColumns[boardColumns.length - 1];
                if(targetColumn.id === lastColumn.id){
                    //mark done as last column:
                    resolvedAtUpdate = new Date();
                    closedAtUpdate = new Date();
                } 
                else{
                    //not resolved yet:
                    resolvedAtUpdate = null;
                    closedAtUpdate = null;
                }
            }
        }

        const updatedTask = await prisma.task.update({
            where: { id: parseInt(taskId) },
            data: {
                title: title,
                description: description,
                columnId: columnId ? parseInt(columnId) : undefined,
                assigneeId: assigneeId !== undefined ? parsedAssigneeId : undefined,
                priority: priority,
                dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
                issueType: issueType,
                parentId: parentId !== undefined ? (parentId ? parseInt(parentId) : null) : undefined,
                resolvedAt:resolvedAtUpdate,
                closedAt:closedAtUpdate,
            }
        });

        if (auditLogsData.length > 0) {
            await prisma.auditLog.createMany({
                data: auditLogsData
            });
        }
        if(oldTask.parentId && columnId && oldTask.columnId !== parseInt(columnId)){
            await syncStoryStatus(oldTask.parentId, userId);
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
        if(deletedTask.parentId && req.user && req.user.userId){
            await syncStoryStatus(deletedTask.parentId, req.user.userId);
        }
        res.status(200).json({message: "Task deleted successfully",deletedTask});
    } 
    catch(error){
        if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return next(new AppError ("Task not found.", 404));
        } 
        else{
            next(error); 
        }
    }
};

export const moveTask = async (req:Request, res: Response, next: NextFunction): Promise<void>=>{
    try{
        const {taskId} = req.params;
        const {targetColumnId, newOrder} = req.body;
        if(!req.user){
            return next(new AppError("Unauthorized", 400));
        }
        const userId = req.user.userId;
        const taskToMove = await prisma.task.findUnique({
            where:{
                id:Number(taskId),
            },
        });
        if(!taskToMove){
            return next(new AppError("Task not found.", 404));
        }
        if(taskToMove.issueType === 'STORY'){
            return next(new AppError("Stories cannot be directly moved across columns.", 400));
        }
        const targetColumn = await prisma.column.findUnique({
            where:{
                id:parseInt(targetColumnId),
            },
        });
        if(!targetColumn){
            return next(new AppError("Target column not found.", 404));
        }

        const boardColumns = await prisma.column.findMany({
            where:{ boardId: targetColumn.boardId },
            orderBy:{ order: 'asc' }
        });
        const lastColumn = boardColumns[boardColumns.length - 1];
        let resolvedAtUpdate: Date | null = null;
        let closedAtUpdate: Date | null = null;
        if(targetColumn.id === lastColumn.id){
            resolvedAtUpdate = new Date();
            closedAtUpdate = new Date();
        }
        await enforceWipLimit(parseInt(targetColumnId));
        const updatedTask = await prisma.task.update({
            where: { id: parseInt(taskId) },
            data: { 
                columnId: parseInt(targetColumnId),
                order: parseFloat(newOrder),
                resolvedAt: resolvedAtUpdate,
                closedAt: closedAtUpdate,
            }
        });

        if(taskToMove.columnId !== parseInt(targetColumnId)){
            const usersToNotify = new Set<number>();
            if(taskToMove.assigneeId && taskToMove.assigneeId !== userId) usersToNotify.add(taskToMove.assigneeId);
            if(taskToMove.reporterId && taskToMove.reporterId !== userId) usersToNotify.add(taskToMove.reporterId);

            const statusNotifications = Array.from(usersToNotify).map(targetUserId => ({
                userId: targetUserId,
                taskId: parseInt(taskId),
                type: 'STATUS_CHANGED' as const,
                message: `The status of "${taskToMove.title}" was updated.`
            }));

            if(statusNotifications.length > 0){
                await prisma.notification.createMany({ data: statusNotifications });
            }
        }

        if(taskToMove.parentId && taskToMove.columnId !== parseInt(targetColumnId)){
            await syncStoryStatus(taskToMove.parentId, userId);
        }
        res.status(200).json(updatedTask);
    }
    catch(error){
        next(error);
    }
}