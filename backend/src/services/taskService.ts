import { prisma } from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';
import { AppError } from '../../types/appError.js';
import {
  enforceWipLimit,
  validateAssigneeMembership,
  validateTaskHierarchy,
  validateTransition,
  getResolutionDatesForColumn,
  syncStoryStatus,
} from '../utils/taskHelpers.js';
import {
  notifyStatusChanged,
  notifyTaskAssigned,
  buildActivityTimeline,
} from './taskActivityService.js';
import { TaskDTO, UpdateTaskDTO, MoveTaskDTO } from '../types/dtos.js';

export const createTask = async (data: TaskDTO, reporterId: number) => {
  const {
    title,
    columnId,
    description,
    order,
    issueType,
    priority,
    assigneeId,
    parentId,
    dueDate,
  } = data;

  if (!title || !columnId)
    throw new AppError('Task title and columnId are required.', 400);

  //Checking hierarchy and wip limit:
  await validateTaskHierarchy(
    parentId ? Number(parentId) : null,
    issueType || 'TASK',
  );
  await enforceWipLimit(Number(columnId), issueType || 'TASK');
  if (assigneeId)
    await validateAssigneeMembership(Number(assigneeId), Number(columnId));

  // Safely determine the next order dynamically to prevent Unique Constraint Violations
  const lastTask = await prisma.task.findFirst({
    where: { columnId: Number(columnId) },
    orderBy: { order: 'desc' },
    select: { order: true },
  });
  const nextOrder = lastTask ? lastTask.order + 1 : 0;

  //Creating database:
  const newTask = await prisma.task.create({
    data: {
      title,
      columnId: Number(columnId),
      reporterId,
      description: description || null,
      issueType: issueType || 'TASK',
      priority: priority || 'MEDIUM',
      order: nextOrder,
      assigneeId: assigneeId ? Number(assigneeId) : null,
      parentId: parentId ? Number(parentId) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  //Audit log:
  await prisma.auditLog.create({
    data: { taskId: newTask.id, userId: reporterId, type: 'TASK_CREATED' },
  });

  //Notification if reporter assigneed to someone else:
  if (newTask.assigneeId && newTask.assigneeId !== reporterId) {
    await notifyTaskAssigned(
      newTask.id,
      newTask.title,
      newTask.assigneeId,
      reporterId,
    );
  }

  //Changing story status if added to a story:
  if (newTask.parentId) await syncStoryStatus(newTask.parentId, reporterId);

  // Touch project timestamp
  const col = await prisma.column.findUnique({
    where: { id: Number(columnId) },
    select: { board: { select: { projectId: true } } },
  });
  if (col) {
    await prisma.project.update({
      where: { id: col.board.projectId },
      data: { updatedAt: new Date() },
    });
  }

  return newTask;
};

export const getTaskWithTimeline = async (taskId: number) => {
  // Getting the required data from database:
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      reporter: { select: { id: true, username: true, avatar: true } },
      assignee: { select: { id: true, username: true, avatar: true } },
      children: true,
      comments: {
        include: {
          author: { select: { id: true, username: true, avatar: true } },
        },
      },
      auditLogs: {
        include: {
          user: { select: { id: true, username: true, avatar: true } },
        },
      },
    },
  });

  if (!task) throw new AppError('Task not found', 404);

  //Format the unified activity feed
  const timeline = buildActivityTimeline(task.comments, task.auditLogs);
  const { comments, auditLogs, ...taskDetails } = task;

  return { ...taskDetails, activityTimeline: timeline };
};

export const updateTask = async (
  taskId: number,
  data: UpdateTaskDTO,
  userId: number,
) => {
  const {
    title,
    description,
    columnId,
    assigneeId,
    priority,
    dueDate,
    issueType,
    parentId,
  } = data;

  //Pulling current data:
  const oldTask = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
    select: {
      title: true,
      columnId: true,
      priority: true,
      issueType: true,
      parentId: true,
      assigneeId: true,
      reporterId: true,
      resolvedAt: true,
      column: {
        select: { boardId: true, board: { select: { projectId: true } } },
      },
    },
  });
  if (!oldTask) throw new AppError('Task not found.', 404);

  if (issueType && issueType !== oldTask.issueType) {
    if (
      !(oldTask.issueType === 'TASK' && issueType === 'BUG') &&
      !(oldTask.issueType === 'BUG' && issueType === 'TASK')
    ) {
      throw new AppError(
        'Issue type conversion is only allowed between TASK and BUG.',
        400,
      );
    }
  }

  // Checking hierarchy:
  const targetParentId =
    parentId !== undefined
      ? parentId
        ? Number(parentId)
        : null
      : oldTask.parentId;
  await validateTaskHierarchy(targetParentId, issueType || oldTask.issueType);

  if (
    oldTask.issueType === 'STORY' &&
    columnId &&
    oldTask.columnId !== Number(columnId)
  ) {
    throw new AppError('A Story cannot be directly moved across columns.', 400);
  }

  const auditLogsData: Prisma.AuditLogCreateManyInput[] = [];
  //If column changed:
  if (columnId && oldTask.columnId !== Number(columnId)) {
    await validateTransition(
      oldTask.column.boardId,
      oldTask.columnId,
      Number(columnId),
    );
    await enforceWipLimit(Number(columnId), issueType || oldTask.issueType);

    auditLogsData.push({
      taskId,
      userId,
      type: 'STATUS_CHANGE',
      oldValue: oldTask.columnId.toString(),
      newValue: columnId.toString(),
    });
    await notifyStatusChanged(
      taskId,
      oldTask.title,
      oldTask.assigneeId,
      oldTask.reporterId,
      userId,
    );
  }

  //If assignee changed
  const parsedAssigneeId =
    assigneeId !== undefined
      ? assigneeId
        ? Number(assigneeId)
        : null
      : undefined;
  if (assigneeId !== undefined && oldTask.assigneeId !== parsedAssigneeId) {
    if (typeof parsedAssigneeId === 'number') {
      await validateAssigneeMembership(
        parsedAssigneeId,
        columnId ? Number(columnId) : oldTask.columnId,
      );
      await notifyTaskAssigned(taskId, oldTask.title, parsedAssigneeId, userId);
    }
    auditLogsData.push({
      taskId,
      userId,
      type: 'ASSIGNEE_CHANGE',
      oldValue: oldTask.assigneeId?.toString() || 'Unassigned',
      newValue: parsedAssigneeId?.toString() || 'Unassigned',
    });
  }

  //If Priority Change
  if (priority && oldTask.priority !== priority) {
    auditLogsData.push({
      taskId,
      userId,
      type: 'PRIORITY_CHANGE',
      oldValue: oldTask.priority,
      newValue: priority,
    });
  }

  //Calculating resolved and created date:
  let dates: {
    resolvedAt: Date | null | undefined;
    closedAt: Date | null | undefined;
  } = {
    resolvedAt: oldTask.resolvedAt,
    closedAt: undefined,
  };
  if (columnId && oldTask.columnId !== Number(columnId)) {
    dates = await getResolutionDatesForColumn(
      Number(columnId),
      oldTask.resolvedAt,
    );
  }
  //Updating the database:
  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      title,
      description,
      priority,
      issueType,
      columnId: columnId ? Number(columnId) : undefined,
      assigneeId: assigneeId !== undefined ? parsedAssigneeId : undefined,
      dueDate:
        dueDate !== undefined
          ? dueDate
            ? new Date(dueDate)
            : null
          : undefined,
      parentId:
        parentId !== undefined
          ? parentId
            ? Number(parentId)
            : null
          : undefined,
      resolvedAt: dates.resolvedAt,
      closedAt: dates.closedAt,
    },
  });

  //Maintaining logs and syncing story:
  if (auditLogsData.length > 0)
    await prisma.auditLog.createMany({ data: auditLogsData });
  if (oldTask.parentId && columnId && oldTask.columnId !== Number(columnId)) {
    await syncStoryStatus(oldTask.parentId, userId);
  }
  if (updatedTask.parentId && updatedTask.parentId !== oldTask.parentId) {
    await syncStoryStatus(updatedTask.parentId, userId);
  }

  // Touch project timestamp
  await prisma.project.update({
    where: { id: oldTask.column.board.projectId },
    data: { updatedAt: new Date() },
  });

  return updatedTask;
};

export const moveTask = async (
  taskId: number,
  data: MoveTaskDTO,
  userId: number,
) => {
  const { targetColumnId, newOrder } = data;

  //Pulling issueType:
  const taskToMove = await prisma.task.findUnique({
    where: { id: taskId },
    include: { column: { include: { board: true } } },
  });
  if (!taskToMove) throw new AppError('Task not found.', 404);
  if (taskToMove.issueType === 'STORY')
    throw new AppError('Stories cannot be directly moved across columns.', 400);

  const targetColumn = await prisma.column.findUnique({
    where: { id: Number(targetColumnId) },
  });
  if (!targetColumn) throw new AppError('Target column not found.', 404);
  if (taskToMove.column.boardId !== targetColumn.boardId)
    throw new AppError('Cross-board transfers are not allowed.', 400);

  const isSameColumn = taskToMove.columnId === Number(targetColumnId);

  //Processing drag and drop:
  if (!isSameColumn) {
    await validateTransition(
      taskToMove.column.boardId,
      taskToMove.columnId,
      Number(targetColumnId),
    );
    await prisma.auditLog.create({
      data: {
        taskId,
        userId,
        type: 'STATUS_CHANGE',
        oldValue: taskToMove.columnId.toString(),
        newValue: targetColumnId.toString(),
      },
    });
    await notifyStatusChanged(
      taskId,
      taskToMove.title,
      taskToMove.assigneeId,
      taskToMove.reporterId,
      userId,
    );
  }

  //WIP Limits and Timestamps
  if (!isSameColumn) {
    await enforceWipLimit(Number(targetColumnId), taskToMove.issueType);
  }
  const dates = isSameColumn
    ? { resolvedAt: undefined, closedAt: undefined }
    : await getResolutionDatesForColumn(
        Number(targetColumnId),
        taskToMove.resolvedAt,
      );

  //Updating db
  const newOrderInt = Number(newOrder);
  const oldOrderInt = taskToMove.order;

  const updatedTask = await prisma.$transaction(async (tx) => {
    if (!isSameColumn) {
      // Case 1: Moving to a different column
      // Shifting tasks up in old column:
      await tx.task.updateMany({
        where: { columnId: taskToMove.columnId, order: { gt: oldOrderInt } },
        data: { order: { decrement: 1 } },
      });
      //Shifting tasks down in new column:
      // B. Make room in the new column (shift items down)
      await tx.task.updateMany({
        where: {
          columnId: Number(targetColumnId),
          order: { gte: newOrderInt },
        },
        data: { order: { increment: 1 } },
      });
    } else {
      // Case 2: Moving within the SAME column
      if (oldOrderInt < newOrderInt) {
        //Moving task down so shift intermediate tasks up:
        await tx.task.updateMany({
          where: {
            columnId: Number(targetColumnId),
            order: { gt: oldOrderInt, lte: newOrderInt },
          },
          data: { order: { decrement: 1 } },
        });
      } else if (oldOrderInt > newOrderInt) {
        //Moving tasks up so intermediate tasks down:
        await tx.task.updateMany({
          where: {
            columnId: Number(targetColumnId),
            order: { gte: newOrderInt, lt: oldOrderInt },
          },
          data: { order: { increment: 1 } },
        });
      }
    }

    //Update the task:
    return await tx.task.update({
      where: { id: taskId },
      data: {
        columnId: Number(targetColumnId),
        order: newOrderInt,
        resolvedAt: dates.resolvedAt,
        closedAt: dates.closedAt,
      },
    });
  });

  //Auto story status:
  if (taskToMove.parentId && taskToMove.columnId !== Number(targetColumnId)) {
    await syncStoryStatus(taskToMove.parentId, userId);
  }

  // Touch project timestamp
  await prisma.project.update({
    where: { id: taskToMove.column.board.projectId },
    data: { updatedAt: new Date() },
  });

  return updatedTask;
};

export const deleteTask = async (taskId: number, userId: number) => {
  try {
    const deletedTask = await prisma.task.delete({
      where: { id: taskId },
      include: { column: { include: { board: true } } },
    });

    //Recalculating parent story status if deleted a child of it:
    if (deletedTask.parentId)
      await syncStoryStatus(deletedTask.parentId, userId);

    // Touch project timestamp
    await prisma.project.update({
      where: { id: deletedTask.column.board.projectId },
      data: { updatedAt: new Date() },
    });

    return deletedTask;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    )
      throw new AppError('Task not found.', 404);
    throw error;
  }
};
