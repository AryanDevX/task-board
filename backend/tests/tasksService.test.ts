import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import * as taskService from '../src/services/taskService.js';
import * as taskHelpers from '../src/utils/taskHelpers.js';
import * as taskActivityService from '../src/services/taskActivityService.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../types/appError.js';
import { Prisma } from '@prisma/client';

interface HttpError extends Error {
  statusCode: number;
}
type TaskPayload = {
  id: number;
  title: string;
  columnId: number;
  issueType: string;
  priority: string;
  parentId: number | null;
};

const prismaMock = prisma as unknown as {
  task: {
    create: (args: unknown) => Promise<unknown>;
    findFirst: (args: unknown) => Promise<unknown>;
    findUnique: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
  };
  auditLog: {
    create: (args: unknown) => Promise<unknown>;
    createMany: (args: unknown) => Promise<unknown>;
  };
  $transaction: (
    callback: (tx: unknown) => Promise<unknown>,
  ) => Promise<unknown>;
};

//faking the different method so that actual method are not called:
mock.method(taskHelpers, 'validateTaskHierarchy', async () => {});
mock.method(taskHelpers, 'enforceWipLimit', async () => {});
mock.method(taskHelpers, 'validateAssigneeMembership', async () => {});
mock.method(taskHelpers, 'validateTransition', async () => {});
mock.method(taskHelpers, 'getResolutionDatesForColumn', async () => ({
  resolvedAt: null,
  closedAt: null,
}));
mock.method(taskHelpers, 'syncStoryStatus', async () => {});
mock.method(taskActivityService, 'notifyStatusChanged', async () => {});
mock.method(taskActivityService, 'notifyTaskAssigned', async () => {});
mock.method(taskActivityService, 'buildActivityTimeline', () => []);

//create task:
test('createTask - successfully creates a task', async () => {
  prismaMock.task.findFirst = async () => ({ order: 5 });
  prismaMock.task.create = async (args: unknown) => {
    const requestArgs = args as { data: Record<string, unknown> };
    return { id: 1, ...requestArgs.data };
  };
  prismaMock.auditLog.create = async () => ({});
  const result = (await taskService.createTask(
    { title: 'New Task', columnId: 5, issueType: 'TASK' },
    1,
  )) as TaskPayload;
  assert.equal(result.id, 1);
  assert.equal(result.title, 'New Task');
  assert.equal(result.columnId, 5);
});
test('createTask - throws 400 if title or columnId is missing', async () => {
  let caughtError: unknown;
  try {
    await taskService.createTask({ title: '', columnId: 5 }, 1);
  } catch (e) {
    caughtError = e;
  }
  assert.ok(caughtError instanceof AppError);
  assert.equal((caughtError as HttpError).statusCode, 400);
});

//get task with timeline:
test('getTaskWithTimeline - successfully fetches task and builds timeline', async () => {
  prismaMock.task.findUnique = async () => ({
    id: 10,
    title: 'Details',
    comments: [],
    auditLogs: [],
  });
  const result = (await taskService.getTaskWithTimeline(10)) as TaskPayload & {
    activityTimeline: unknown[];
  };
  assert.equal(result.id, 10);
  assert.deepEqual(result.activityTimeline, []);
});
test('getTaskWithTimeline - throws 404 if task not found', async () => {
  prismaMock.task.findUnique = async () => null;
  let caughtError: unknown;
  try {
    await taskService.getTaskWithTimeline(99);
  } catch (e) {
    caughtError = e;
  }
  assert.ok(caughtError instanceof AppError);
  assert.equal((caughtError as HttpError).statusCode, 404);
});

//update task:
test('updateTask - successfully updates a task', async () => {
  prismaMock.task.findUnique = async () => ({
    id: 10,
    title: 'Old Task',
    issueType: 'TASK',
    columnId: 5,
    column: { boardId: 1 },
  });
  prismaMock.task.update = async (args: unknown) => {
    const requestArgs = args as { data: Record<string, unknown> };
    return { id: 10, ...requestArgs.data };
  };
  const result = (await taskService.updateTask(
    10,
    { title: 'Updated Task' },
    1,
  )) as TaskPayload;
  assert.equal(result.title, 'Updated Task');
});
test('updateTask - throws 400 for invalid issueType conversion', async () => {
  prismaMock.task.findUnique = async () => ({ id: 10, issueType: 'STORY' });
  let caughtError: unknown;
  try {
    await taskService.updateTask(10, { issueType: 'BUG' }, 1);
  } catch (e) {
    caughtError = e;
  }
  assert.ok(caughtError instanceof AppError);
  assert.equal((caughtError as HttpError).statusCode, 400);
});
test('updateTask - throws 404 if task not found', async () => {
  prismaMock.task.findUnique = async () => null;
  let caughtError: unknown;
  try {
    await taskService.updateTask(99, { title: 'Updated Task' }, 1);
  } catch (e) {
    caughtError = e;
  }
  assert.ok(caughtError instanceof AppError);
  assert.equal((caughtError as HttpError).statusCode, 404);
});

//move task:
test('moveTask - successfully moves a task via transaction', async () => {
  prismaMock.task.findUnique = async () => ({
    id: 10,
    title: 'Moved Task',
    issueType: 'TASK',
    columnId: 5,
    order: 1,
    column: { boardId: 1 },
  });
  prismaMock.$transaction = async (
    callback: (tx: unknown) => Promise<unknown>,
  ) => {
    const fakeTx = {
      task: {
        updateMany: async () => ({ count: 1 }),
        update: async () => ({ id: 10, columnId: 6, order: 2 }),
      },
    };
    return await callback(fakeTx);
  };
  const result = (await taskService.moveTask(
    10,
    { targetColumnId: 6, newOrder: 2 },
    1,
  )) as TaskPayload;
  assert.equal(result.id, 10);
});
test('moveTask - throws 400 if trying to move a STORY directly', async () => {
  prismaMock.task.findUnique = async () => ({
    id: 10,
    issueType: 'STORY',
    column: { boardId: 1 },
  });
  let caughtError: unknown;
  try {
    await taskService.moveTask(10, { targetColumnId: 6, newOrder: 2 }, 1);
  } catch (e) {
    caughtError = e;
  }
  assert.ok(caughtError instanceof AppError);
  assert.equal((caughtError as HttpError).statusCode, 400);
});

//delete task:
test('deleteTask - successfully deletes a task', async () => {
  prismaMock.task.delete = async () => ({
    id: 10,
    title: 'Deleted',
    parentId: null,
  });
  const result = (await taskService.deleteTask(10, 1)) as TaskPayload;
  assert.equal(result.id, 10);
});
test('deleteTask - throws 404 on Prisma P2025 error', async () => {
  prismaMock.task.delete = async () => {
    throw new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: 'test',
    });
  };
  let caughtError: unknown;
  try {
    await taskService.deleteTask(99, 1);
  } catch (e) {
    caughtError = e;
  }
  assert.ok(caughtError instanceof AppError);
  assert.equal((caughtError as HttpError).statusCode, 404);
});
test('deleteTask - passes non-P2025 unexpected errors upward', async () => {
  const genericError = new Error('Database crash');
  prismaMock.task.delete = async () => {
    throw genericError;
  };
  let caughtError: unknown;
  try {
    await taskService.deleteTask(10, 1);
  } catch (e) {
    caughtError = e;
  }
  assert.strictEqual(caughtError, genericError);
});
