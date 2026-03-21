import test from 'node:test';
import assert from 'node:assert/strict';
import * as columnService from '../src/services/columnService.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../types/appError.js';
import { Prisma } from '@prisma/client';

//type definitions:
interface HttpError extends Error {
  statusCode: number;
}
type ColumnPayload = {
  id: number;
  title: string;
  order: number;
  boardId: number;
  status: string;
  wipLimit: number | null;
};

// mock setup:
const prismaMock = prisma as unknown as {
  column: {
    create: (args: unknown) => Promise<unknown>;
    findMany: (args: unknown) => Promise<unknown[]>;
    findUnique: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
  };
  $transaction: (
    callback: (tx: unknown) => Promise<unknown>,
  ) => Promise<unknown>;
};

//test started:

//create column:
test('createColumn - successfully creates a column', async () => {
  prismaMock.column.create = async (args: unknown) => {
    const requestArgs = args as { data: Record<string, unknown> };
    return { id: 1, ...requestArgs.data };
  };
  const result = (await columnService.createColumn(5, {
    title: 'New Col',
    order: 2,
    wipLimit: 5,
  })) as ColumnPayload;
  assert.equal(result.id, 1);
  assert.equal(result.title, 'New Col');
  assert.equal(result.boardId, 5);
  assert.equal(result.order, 2);
  assert.equal(result.wipLimit, 5);
});
test('createColumn - throws 400 if title is missing', async () => {
  let caughtError: unknown;
  try {
    await columnService.createColumn(5, { title: '' });
  } catch (error) {
    caughtError = error;
  }
  assert.ok(caughtError instanceof AppError);
  assert.equal((caughtError as HttpError).statusCode, 400);
});

//get columns:
test('getColumnsByBoardId - successfully fetches columns', async () => {
  prismaMock.column.findMany = async () => [
    { id: 1, title: 'Col 1', boardId: 5, order: 0, status: 'TODO' },
  ];
  const results = (await columnService.getColumnsByBoardId(
    5,
  )) as ColumnPayload[];
  assert.equal(results.length, 1);
  assert.equal(results[0].boardId, 5);
});

//update column:
test('updateColumn - successfully updates a column without changing order', async () => {
  prismaMock.column.findUnique = async () => ({
    id: 10,
    title: 'Old Title',
    order: 1,
    boardId: 5,
    status: 'TODO',
  });
  prismaMock.column.update = async (args: unknown) => {
    const requestArgs = args as { data: Record<string, unknown> };
    return { id: 10, boardId: 5, order: 1, ...requestArgs.data };
  };
  const result = (await columnService.updateColumn(10, {
    title: 'New Title',
  })) as ColumnPayload;
  assert.equal(result.title, 'New Title');
  assert.equal(result.order, 1); // Order should remaine the same so done this
});
test('updateColumn - successfully shifts columns and updates order', async () => {
  prismaMock.column.findUnique = async () => ({
    id: 10,
    title: 'Old Title',
    order: 1,
    boardId: 5,
    status: 'TODO',
  });
  //mocking the interactive transaction callback
  prismaMock.$transaction = async (
    callback: (tx: unknown) => Promise<unknown>,
  ) => {
    const fakeTx = {
      column: {
        updateMany: async () => ({ count: 1 }),
        update: async () => ({ id: 10 }),
      },
    };
    return await callback(fakeTx);
  };
  const result = (await columnService.updateColumn(10, {
    order: 3,
  })) as ColumnPayload;
  //to returns the findUnique payload at the end of the transaction logic
  assert.equal(result.id, 10);
});
test('updateColumn - throws 404 if column to update is not found', async () => {
  prismaMock.column.findUnique = async () => null;
  let caughtError: unknown;
  try {
    await columnService.updateColumn(99, { title: 'Updated Title' });
  } catch (error) {
    caughtError = error;
  }
  assert.ok(caughtError instanceof AppError);
  assert.equal((caughtError as HttpError).statusCode, 404);
});

// delete column:
test('deleteColumn - successfully deletes a column', async () => {
  prismaMock.column.delete = async () => ({
    id: 10,
    title: 'To Delete',
    boardId: 5,
    order: 2,
    status: 'TODO',
  });
  const result = (await columnService.deleteColumn(10)) as ColumnPayload;
  assert.equal(result.id, 10);
});
test('deleteColumn - throws 404 if column to delete is not found (Prisma P2025)', async () => {
  prismaMock.column.delete = async () => {
    throw new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: 'test',
    });
  };
  let caughtError: unknown;
  try {
    await columnService.deleteColumn(99);
  } catch (error) {
    caughtError = error;
  }
  assert.ok(caughtError instanceof AppError);
  assert.equal((caughtError as HttpError).statusCode, 404);
});
test('deleteColumn - passes non-P2025 unexpected errors upward', async () => {
  const genericError = new Error('Database disconnected');
  prismaMock.column.delete = async () => {
    throw genericError;
  };
  let caughtError: unknown;
  try {
    await columnService.deleteColumn(10);
  } catch (error) {
    caughtError = error;
  }
  assert.strictEqual(caughtError, genericError);
});
