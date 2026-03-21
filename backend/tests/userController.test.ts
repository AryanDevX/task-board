import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getUsers,
  updateUserGlobalRole,
  updateAvatar,
} from '../src/controllers/userController.js';
import { prisma } from '../lib/prisma.js';

type mockRequest = {
  query: Record<string, string>;
  params: Record<string, string>;
  body: Record<string, unknown>;
  user?: { userId: number; globalRole?: string };
  file?: { filename: string };
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

const prismaMock = prisma as unknown as {
  user: {
    findMany: (args: unknown) => Promise<unknown[]>;
    count: (args: unknown) => Promise<number>;
    update: (args: unknown) => Promise<unknown>;
  };
};

const createReq = (overrides: Partial<mockRequest> = {}): mockRequest => ({
  query: {},
  params: {},
  body: {},
  user: { userId: 1, globalRole: 'USER' },
  ...overrides,
});
const createRes = (): mockResponse => ({
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
});
const createNext = () => {
  const calls: unknown[] = [];
  return {
    next: (value?: unknown) => {
      calls.push(value);
    },
    calls,
  };
};

test('getUsers - successfully paginates and fetches users', async () => {
  prismaMock.user.findMany = async () => [{ id: 1, username: 'test' }];
  prismaMock.user.count = async () => 1;
  const req = createReq({ query: { page: '1', limit: '10' } });
  const res = createRes();
  const { next, calls } = createNext();
  await getUsers(req as never, res as never, next as never);
  assert.equal(res.statusCode, 200);
  assert.equal(
    ((res.jsonPayload as { users: unknown[] }).users[0] as { id: number }).id,
    1,
  );
});
test('getUsers - passes unexpected errors to next()', async () => {
  const mockError = new Error('DB Crash');
  prismaMock.user.findMany = async () => {
    throw mockError;
  };
  const req = createReq();
  const res = createRes();
  const { next, calls } = createNext();
  await getUsers(req as never, res as never, next as never);
  assert.strictEqual(calls[0], mockError);
});
test('updateUserGlobalRole - updates role if requester is GLOBAL_ADMIN', async () => {
  prismaMock.user.update = async () => ({ id: 5, globalRole: 'GLOBAL_ADMIN' });
  const req = createReq({
    params: { id: '5' },
    body: { globalRole: 'GLOBAL_ADMIN' },
    user: { userId: 1, globalRole: 'GLOBAL_ADMIN' },
  });
  const res = createRes();
  const { next, calls } = createNext();
  await updateUserGlobalRole(req as never, res as never, next as never);
  assert.equal(res.statusCode, 200);
});
test('updateUserGlobalRole - fails if requester is not GLOBAL_ADMIN', async () => {
  const req = createReq({
    params: { id: '5' },
    body: { globalRole: 'GLOBAL_ADMIN' },
    user: { userId: 1, globalRole: 'USER' },
  });
  const res = createRes();
  const { next, calls } = createNext();
  await updateUserGlobalRole(req as never, res as never, next as never);
  assert.equal((calls[0] as HttpError).statusCode, 403);
});
test('updateUserGlobalRole - passes unexpected errors to next()', async () => {
  const mockError = new Error('DB Crash');
  prismaMock.user.update = async () => {
    throw mockError;
  };
  const req = createReq({
    params: { id: '5' },
    body: { globalRole: 'GLOBAL_ADMIN' },
    user: { userId: 1, globalRole: 'GLOBAL_ADMIN' },
  });
  const res = createRes();
  const { next, calls } = createNext();
  await updateUserGlobalRole(req as never, res as never, next as never);
  assert.strictEqual(calls[0], mockError);
});
test('updateAvatar - successfully updates avatar', async () => {
  prismaMock.user.update = async () => ({
    avatar: '/uploads/avatars/test.jpg',
  });
  const req = createReq({ file: { filename: 'test.jpg' } });
  const res = createRes();
  const { next, calls } = createNext();
  await updateAvatar(req as never, res as never, next as never);
  assert.equal(res.statusCode, 200);
});
test('updateAvatar - fails if no file provided', async () => {
  const req = createReq({ file: undefined });
  const res = createRes();
  const { next, calls } = createNext();
  await updateAvatar(req as never, res as never, next as never);
  assert.equal((calls[0] as HttpError).statusCode, 400);
});
test('updateAvatar - passes unexpected errors to next()', async () => {
  const mockError = new Error('DB Crash');
  prismaMock.user.update = async () => {
    throw mockError;
  };
  const req = createReq({ file: { filename: 'test.jpg' } });
  const res = createRes();
  const { next, calls } = createNext();
  await updateAvatar(req as never, res as never, next as never);
  assert.strictEqual(calls[0], mockError);
});
