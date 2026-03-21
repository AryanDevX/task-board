import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  createTask,
  getTask,
  getTasks,
  updateTask,
  moveTask,
  deleteTask,
} from '../src/controllers/taskController.js';
import * as taskService from '../src/services/taskService.js';
import { prisma } from '../lib/prisma.js';

type mockRequest = {
  params: Record<string, string>;
  body: Record<string, unknown>;
  user?: { userId: number };
};
type mockResponse = {
  statusCode: number | null;
  jsonPayload: unknown;
  status: (code: number) => mockResponse;
  json: (payload: unknown) => mockResponse;
};
interface HttpError extends Error {
  statusCode: number;
}
type TaskPayload = {
  id: number;
  title: string;
  columnId: number;
  order: number;
};

const prismaMock = prisma as unknown as {
  task: { findMany: (args: unknown) => Promise<unknown[]> };
};

const createReq = (overrides: Partial<mockRequest> = {}): mockRequest => ({
  params: {},
  body: {},
  user: { userId: 1 },
  ...overrides,
});
const createRes = (): mockResponse => {
  const res: mockResponse = {
    statusCode: null,
    jsonPayload: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.jsonPayload = payload;
      return this;
    },
  };
  return res;
};
const createNext = () => {
  const calls: unknown[] = [];
  const next = (value?: unknown) => {
    calls.push(value);
  };
  return { next, calls };
};

test('createTask - successfully creates a task', async () => {
  mock.method(taskService, 'createTask', async () => ({
    id: 1,
    title: 'New Task',
    columnId: 5,
    order: 0,
  }));
  const req = createReq({ body: { title: 'New Task', columnId: 5 } });
  const res = createRes();
  const { next, calls } = createNext();
  await createTask(req as never, res as never, next as never);
  const payload = res.jsonPayload as TaskPayload;
  assert.equal(res.statusCode, 201);
  assert.equal(payload.title, 'New Task');
  assert.equal(calls.length, 0);
});
test('createTask - fails if unauthorized', async () => {
  const req = createReq({
    user: undefined,
    body: { title: 'New Task', columnId: 5 },
  });
  const res = createRes();
  const { next, calls } = createNext();
  await createTask(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 401);
});
test('createTask - passes unexpected errors to next()', async () => {
  const mockError = new Error('Service crashed');
  mock.method(taskService, 'createTask', async () => {
    throw mockError;
  });
  const req = createReq({ body: { title: 'New Task', columnId: 5 } });
  const res = createRes();
  const { next, calls } = createNext();
  await createTask(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.strictEqual(calls[0], mockError);
});

test('getTask - successfully fetches a single task', async () => {
  mock.method(taskService, 'getTaskWithTimeline', async () => ({
    id: 10,
    title: 'Details',
    columnId: 5,
    order: 1,
  }));
  const req = createReq({ params: { taskId: '10' } });
  const res = createRes();
  const { next, calls } = createNext();
  await getTask(req as never, res as never, next as never);
  const payload = res.jsonPayload as TaskPayload;
  assert.equal(res.statusCode, 200);
  assert.equal(payload.id, 10);
  assert.equal(calls.length, 0);
});
test('getTask - fails if taskId is missing', async () => {
  const req = createReq({ params: {} });
  const res = createRes();
  const { next, calls } = createNext();
  await getTask(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 400);
});
test('getTask - passes unexpected errors to next()', async () => {
  const mockError = new Error('Service crashed');
  mock.method(taskService, 'getTaskWithTimeline', async () => {
    throw mockError;
  });
  const req = createReq({ params: { taskId: '10' } });
  const res = createRes();
  const { next, calls } = createNext();
  await getTask(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.strictEqual(calls[0], mockError);
});

test('getTasks - successfully fetches tasks using Prisma', async () => {
  prismaMock.task.findMany = async () => [
    { id: 1, title: 'Task 1', columnId: 5, order: 0 },
  ];
  const req = createReq({ params: { columnId: '5' } });
  const res = createRes();
  const { next, calls } = createNext();
  await getTasks(req as never, res as never, next as never);
  const payload = res.jsonPayload as TaskPayload[];
  assert.equal(res.statusCode, 200);
  assert.equal(payload.length, 1);
  assert.equal(payload[0].columnId, 5);
  assert.equal(calls.length, 0);
});
test('getTasks - fails if columnId is missing', async () => {
  const req = createReq({ params: {} });
  const res = createRes();
  const { next, calls } = createNext();
  await getTasks(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 400);
});
test('getTasks - passes unexpected errors to next()', async () => {
  const mockError = new Error('Database crash');
  prismaMock.task.findMany = async () => {
    throw mockError;
  };
  const req = createReq({ params: { columnId: '5' } });
  const res = createRes();
  const { next, calls } = createNext();
  await getTasks(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.strictEqual(calls[0], mockError);
});

//update tas:
test('updateTask - successfully updates a task', async () => {
  mock.method(taskService, 'updateTask', async () => ({
    id: 10,
    title: 'Updated Task',
    columnId: 5,
    order: 1,
  }));
  const req = createReq({
    params: { taskId: '10' },
    body: { title: 'Updated Task' },
  });
  const res = createRes();
  const { next, calls } = createNext();
  await updateTask(req as never, res as never, next as never);
  const payload = res.jsonPayload as TaskPayload;
  assert.equal(res.statusCode, 200);
  assert.equal(payload.title, 'Updated Task');
  assert.equal(calls.length, 0);
});
test('updateTask - fails if unauthorized', async () => {
  const req = createReq({ params: { taskId: '10' }, user: undefined });
  const res = createRes();
  const { next, calls } = createNext();
  await updateTask(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 401);
});
test('updateTask - passes unexpected errors to next()', async () => {
  const mockError = new Error('Service crashed');
  mock.method(taskService, 'updateTask', async () => {
    throw mockError;
  });
  const req = createReq({ params: { taskId: '10' } });
  const res = createRes();
  const { next, calls } = createNext();
  await updateTask(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.strictEqual(calls[0], mockError);
});

// --- MOVE TASK ---
test('moveTask - successfully moves a task', async () => {
  mock.method(taskService, 'moveTask', async () => ({
    id: 10,
    title: 'Moved Task',
    columnId: 6,
    order: 2,
  }));
  const req = createReq({
    params: { taskId: '10' },
    body: { targetColumnId: 6, newOrder: 2 },
  });
  const res = createRes();
  const { next, calls } = createNext();
  await moveTask(req as never, res as never, next as never);
  const payload = res.jsonPayload as TaskPayload;
  assert.equal(res.statusCode, 200);
  assert.equal(payload.columnId, 6);
  assert.equal(calls.length, 0);
});
test('moveTask - fails if unauthorized', async () => {
  const req = createReq({ params: { taskId: '10' }, user: undefined });
  const res = createRes();
  const { next, calls } = createNext();
  await moveTask(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 401);
});
test('moveTask - passes unexpected errors to next()', async () => {
  const mockError = new Error('Service crashed');
  mock.method(taskService, 'moveTask', async () => {
    throw mockError;
  });
  const req = createReq({
    params: { taskId: '10' },
    body: { targetColumnId: 6, newOrder: 2 },
  });
  const res = createRes();
  const { next, calls } = createNext();
  await moveTask(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.strictEqual(calls[0], mockError);
});

//delete task:
test('deleteTask - successfully deletes a task', async () => {
  mock.method(taskService, 'deleteTask', async () => ({
    id: 10,
    title: 'To Delete',
    columnId: 5,
    order: 2,
  }));
  const req = createReq({ params: { taskId: '10' } });
  const res = createRes();
  const { next, calls } = createNext();
  await deleteTask(req as never, res as never, next as never);
  type DeletePayload = { message: string; deletedTask: TaskPayload };
  const payload = res.jsonPayload as DeletePayload;
  assert.equal(res.statusCode, 200);
  assert.equal(payload.message, 'Task deleted successfully');
  assert.equal(payload.deletedTask.id, 10);
  assert.equal(calls.length, 0);
});
test('deleteTask - fails if unauthorized', async () => {
  const req = createReq({ params: { taskId: '10' }, user: undefined });
  const res = createRes();
  const { next, calls } = createNext();
  await deleteTask(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.equal((calls[0] as HttpError).statusCode, 401);
});
test('deleteTask - passes unexpected errors to next()', async () => {
  const mockError = new Error('Service crashed');
  mock.method(taskService, 'deleteTask', async () => {
    throw mockError;
  });
  const req = createReq({ params: { taskId: '10' } });
  const res = createRes();
  const { next, calls } = createNext();
  await deleteTask(req as never, res as never, next as never);
  assert.equal(calls.length, 1);
  assert.strictEqual(calls[0], mockError);
});
