import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../types/appError.js';

// Work In Progress limit:
// Prevents teams from overloading a specific column.
export const enforceWipLimit = async(columnId: number): Promise<void> => {
    const column = await prisma.column.findUnique({ where: { id: columnId } });
    if(!column || column.wipLimit === null) return;

    const currentTaskCount = await prisma.task.count({ where: { columnId } });
    if(currentTaskCount >= column.wipLimit){
        throw new AppError(`WIP Limit Reached: The '${column.title}' column cannot accept more than ${column.wipLimit} tasks.`, 400);
    }
};

// Check a user actually belongs to the project before assigning a task.
export const validateAssigneeMembership = async(assigneeId: number, columnId: number): Promise<void> => {
    const column = await prisma.column.findUnique({
        where: { id: columnId },
        include: { board: { select: { projectId: true } } }
    });
    if(!column) throw new AppError("Target column not found.", 404);
    
    const membership = await prisma.projectMembership.findUnique({
        where: { userId_projectId: { projectId: column.board.projectId, userId: assigneeId } }
    });

    if(!membership){
        throw new AppError("Validation Error: You cannot assign a task to a user who is not a member of this project.", 400);
    }
};

//Maintaining task, bug hierarchy.
// A Task/Bug can only belong to a Story.
// A Story can NEVER be a child of another task.
export const validateTaskHierarchy = async(parentId: number | null, issueType: string): Promise<void> => {
    if(parentId){
        const parent = await prisma.task.findUnique({ where: { id: parentId } });
        if(!parent || parent.issueType !== 'STORY'){
            throw new AppError("Hierarchy Error: A task or bug can only be a child of a STORY.", 400);
        }
        if(issueType === 'STORY'){
            throw new AppError("Hierarchy Error: A STORY cannot be a child of another task.", 400);
        }
    }
};

//Checking workflow transition is allowed to that column:
export const validateTransition = async (boardId: number, fromColumnId: number, toColumnId: number): Promise<void> => {
    const allowedTransition = await prisma.workflowTransition.findFirst({
        where: { 
            boardId: boardId,
            fromColumnId, 
            toColumnId 
        }
    });
    
    if (!allowedTransition) {
        throw new AppError("Invalid status transition for this board's workflow.", 400);
    }
};

//Writing resolved and created at dates for column:
export const getResolutionDatesForColumn = async(
    columnId: number, 
    currentResolvedAt: Date | null
): Promise<{ resolvedAt: Date | null, closedAt: Date | null }> => {
    const targetColumn = await prisma.column.findUnique({
        where: { id: columnId },
        include: { board: { include: { columns: { orderBy: { order: 'asc' } } } } }
    });

    if(!targetColumn || targetColumn.board.columns.length === 0){
        return { resolvedAt: null, closedAt: null };
    }

    const columns = targetColumn.board.columns;
    const lastColumn = columns[columns.length - 1];
    const reviewColumn = columns.length > 2 ? columns[columns.length - 2] : lastColumn;

    // Task reached the final state:
    if(targetColumn.id === lastColumn.id){
        return { resolvedAt: currentResolvedAt || new Date(), closedAt: new Date() };
    } 
    // Task reached the review or another corresponding state
    else if(targetColumn.id === reviewColumn.id && targetColumn.id !== lastColumn.id){
        return { resolvedAt: currentResolvedAt || new Date(), closedAt: null };
    }

    // Task is active
    return { resolvedAt: null, closedAt: null };
};

// Automatically transferring the stories based on child tasks:
export const syncStoryStatus = async(storyId: number, userId: number): Promise<void> => {
    const story = await prisma.task.findUnique({
        where: { id: storyId },
        include: { children: true, column: { include: { board: { include: { columns: { orderBy: { order: 'asc' } } } } } } }
    });

    if(!story || story.issueType !== 'STORY' || story.children.length === 0) return;
    const boardColumns = story.column.board.columns;
    if(boardColumns.length === 0) return;
    
    // Map column id's from 0 to N
    const colIndexMap = new Map(boardColumns.map((col, index) => [col.id, index]));
    const childIndices = story.children.map(c => colIndexMap.get(c.columnId) ?? 0);
    
    let derivedColumnId = story.columnId;
    
    // 1. All children in the exact same column -> Story moves there
    if(Math.min(...childIndices) === Math.max(...childIndices)){
        derivedColumnId = boardColumns[Math.min(...childIndices)].id;
    } 
    // 2. All children finished -> Story moves to Done
    else if(Math.min(...childIndices) === boardColumns.length - 1){
        derivedColumnId = boardColumns[boardColumns.length - 1].id;
    } 
    // 3. No work started -> Story stays in To Do
    else if(Math.max(...childIndices) === 0){
        derivedColumnId = boardColumns[0].id;
    } 
    // RULE 4: Mixed State -> Story enters the active workflow (In Progress)
    else {
        derivedColumnId = boardColumns[boardColumns.length > 1 ? 1 : 0].id;
    }
    
    // If story column not same as derived then update it:
    if(story.columnId !== derivedColumnId){
        const isFinal = derivedColumnId === boardColumns[boardColumns.length - 1].id;
        await prisma.task.update({
            where: { id: storyId },
            data: { columnId: derivedColumnId, resolvedAt: isFinal ? new Date() : null, closedAt: isFinal ? new Date() : null }
        });

        // Audit the automated system movement
        await prisma.auditLog.create({
            data: { taskId: storyId, userId, type: 'STATUS_CHANGE', oldValue: story.columnId.toString(), newValue: derivedColumnId.toString() }
        });
    }
};
