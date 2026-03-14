import { prisma } from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';
import { AppError } from '../../types/appError.js';
import { enforceWipLimit, validateAssigneeMembership, validateTaskHierarchy, validateTransition, getResolutionDatesForColumn, syncStoryStatus } from '../utils/taskHelpers.js';
import { notifyStatusChanged, notifyTaskAssigned, buildActivityTimeline } from './taskActivityService.js';

export const createTask = async(data: any, reporterId: number) => {
    const { title, columnId, description, order, issueType, priority, assigneeId, parentId, dueDate } = data;
    
    if(!title || !columnId) throw new AppError("Task title and columnId are required.", 400);

    //Checking hierarchy and wip limit:
    await validateTaskHierarchy(parentId ? parseInt(parentId) : null, issueType || 'TASK');
    await enforceWipLimit(parseInt(columnId));
    if(assigneeId) await validateAssigneeMembership(parseInt(assigneeId), parseInt(columnId));

    //Creating database:
    const newTask = await prisma.task.create({
        data: {
            title, columnId: parseInt(columnId), reporterId,
            description: description || null, issueType: issueType || 'TASK',
            priority: priority || 'MEDIUM', order: order || 0,
            assigneeId: assigneeId ? parseInt(assigneeId) : null,
            parentId: parentId ? parseInt(parentId) : null,
            dueDate: dueDate ? new Date(dueDate) : null,
        },
    });

    //Audit log:
    await prisma.auditLog.create({ data: { taskId: newTask.id, userId: reporterId, type: 'TASK_CREATED' } });
    
    //Changing story status if added to a story:
    if(newTask.parentId) await syncStoryStatus(newTask.parentId, reporterId);
    
    return newTask;
};

export const getTaskWithTimeline = async(taskId: number) => {
    // Getting the required data from database:
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            reporter: { select: { id: true, username: true, avatar: true } },
            assignee: { select: { id: true, username: true, avatar: true } },
            children: true,
            comments: { include: { author: { select: { id: true, username: true, avatar: true } } } },
            auditLogs: { include: { user: { select: { id: true, username: true, avatar: true } } } }
        }
    });

    if(!task) throw new AppError("Task not found", 404);

    //Format the unified activity feed
    const timeline = buildActivityTimeline(task.comments, task.auditLogs);
    const { comments, auditLogs, ...taskDetails } = task;
    
    return { ...taskDetails, activityTimeline: timeline };
};

export const updateTask = async(taskId: number, data: any, userId: number) => {
    const { title, description, columnId, assigneeId, priority, dueDate, issueType, parentId } = data;
    
    //Pulling current data:
    const oldTask = await prisma.task.findUnique({
        where: { id: taskId }, 
        select: { title: true, columnId: true, priority: true, issueType: true, parentId: true, assigneeId: true, reporterId: true, resolvedAt: true }
    });
    if(!oldTask) throw new AppError("Task not found.", 404);

    // Checking hierarchy:
    const targetParentId = parentId !== undefined ? (parentId ? parseInt(parentId) : null) : oldTask.parentId;
    await validateTaskHierarchy(targetParentId, issueType || oldTask.issueType);

    if(oldTask.issueType === 'STORY' && columnId && oldTask.columnId !== parseInt(columnId)){
        throw new AppError("A Story cannot be directly moved across columns.", 400);
    }

    const auditLogsData: any[] = [];
    
    //If column changed:
    if(columnId && oldTask.columnId !== parseInt(columnId)){
        await validateTransition(oldTask.columnId, parseInt(columnId));
        await enforceWipLimit(parseInt(columnId));
        
        auditLogsData.push({ taskId, userId, type: 'STATUS_CHANGE', oldValue: oldTask.columnId.toString(), newValue: columnId.toString() });
        await notifyStatusChanged(taskId, oldTask.title, oldTask.assigneeId, oldTask.reporterId, userId);
    }

    //If assignee changed
    const parsedAssigneeId = assigneeId !== undefined ? (assigneeId ? parseInt(assigneeId) : null) : undefined;        
    if(assigneeId !== undefined && oldTask.assigneeId !== parsedAssigneeId){
        if(typeof parsedAssigneeId === 'number'){
            await validateAssigneeMembership(parsedAssigneeId, columnId ? parseInt(columnId) : oldTask.columnId);
            await notifyTaskAssigned(taskId, oldTask.title, parsedAssigneeId, userId);
        }
        auditLogsData.push({ taskId, userId, type: 'ASSIGNEE_CHANGE', oldValue: oldTask.assigneeId?.toString() || "Unassigned", newValue: parsedAssigneeId?.toString() || "Unassigned" });
    }

    //If Priority Change
    if(priority && oldTask.priority !== priority){
        auditLogsData.push({ taskId, userId, type: 'PRIORITY_CHANGE', oldValue: oldTask.priority, newValue: priority });
    }
    
    //Calculating resolved and created date:
    let dates = { resolvedAt: oldTask.resolvedAt, closedAt: undefined as any };
    if(columnId && oldTask.columnId !== parseInt(columnId)){
        dates = await getResolutionDatesForColumn(parseInt(columnId), oldTask.resolvedAt);
    }
    //Updating the database:
    const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
            title, description, priority, issueType,
            columnId: columnId ? parseInt(columnId) : undefined,
            assigneeId: assigneeId !== undefined ? parsedAssigneeId : undefined,
            dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
            parentId: parentId !== undefined ? (parentId ? parseInt(parentId) : null) : undefined,
            resolvedAt: dates.resolvedAt, closedAt: dates.closedAt,
        }
    });

    //Maintaining logs and syncing story:
    if(auditLogsData.length > 0) await prisma.auditLog.createMany({ data: auditLogsData });
    if(oldTask.parentId && columnId && oldTask.columnId !== parseInt(columnId)){
        await syncStoryStatus(oldTask.parentId, userId);
    }
    
    return updatedTask;
};

export const moveTask = async(taskId: number, data: any, userId: number) => {
    const { targetColumnId, newOrder } = data;

    //Pulling issueType:
    const taskToMove = await prisma.task.findUnique({ where: { id: taskId }, include: { column: true } });
    if(!taskToMove) throw new AppError("Task not found.", 404);
    if(taskToMove.issueType === 'STORY') throw new AppError("Stories cannot be directly moved across columns.", 400);
    
    const targetColumn = await prisma.column.findUnique({ where: { id: parseInt(targetColumnId) } });
    if(!targetColumn) throw new AppError("Target column not found.", 404);
    if(taskToMove.column.boardId !== targetColumn.boardId) throw new AppError("Cross-board transfers are not allowed.", 400);

    //Processing drag and drop:
    if(taskToMove.columnId !== parseInt(targetColumnId)){
        await validateTransition(taskToMove.columnId, parseInt(targetColumnId));
        await prisma.auditLog.create({ data: { taskId, userId, type: 'STATUS_CHANGE', oldValue: taskToMove.columnId.toString(), newValue: targetColumnId.toString() } });
        await notifyStatusChanged(taskId, taskToMove.title, taskToMove.assigneeId, taskToMove.reporterId, userId);
    }

    //WIP Limits and Timestamps
    await enforceWipLimit(parseInt(targetColumnId));
    const dates = await getResolutionDatesForColumn(parseInt(targetColumnId), taskToMove.resolvedAt);

    //Updating db
    const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: { columnId: parseInt(targetColumnId), order: parseInt(newOrder), resolvedAt: dates.resolvedAt, closedAt: dates.closedAt }
    });

    //Auto story status:
    if(taskToMove.parentId && taskToMove.columnId !== parseInt(targetColumnId)){
        await syncStoryStatus(taskToMove.parentId, userId);
    }
    return updatedTask;
};

export const deleteTask = async(taskId: number, userId: number) => {
    try{
        const deletedTask = await prisma.task.delete({ where: { id: taskId } });
        
        //Recalculating parent story status if deleted a child of it:
        if(deletedTask.parentId) await syncStoryStatus(deletedTask.parentId, userId);
        
        return deletedTask;
    }
    catch(error){
        if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') throw new AppError("Task not found.", 404);
        throw error;
    }
};
