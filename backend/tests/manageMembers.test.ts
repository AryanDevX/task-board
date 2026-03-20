import test from 'node:test'; 
import assert from 'node:assert/strict'; //assert check if the response is same as we expected and strict if for strict type checking.
import {
  addMember, deleteMember, updateMember, getMembers,
} from '../src/controllers/manageMembers';

import { prisma } from '../lib/prisma.js';
import { AppError } from '../types/appError.js';

type mockRequest = {
  params:Record<string, string>;
  body:Record<string,unknown>;
  user?:{
    userId?:number;
    globalRole?:'GLOBAL_ADMIN' | 'USER';
  };
};

type mockResponse = {
  statusCode:number|null;
  jsonPayload:unknown;
  status:(code:number) => mockResponse;
  json:(payload:unknown) => mockResponse;
}

const prismaMock = prisma as unknown as {
  project:{
    findUnique:(args:unknown) => Promise<unknown>;
  };
  user:{
    findUnique:(args:unknown) => Promise<unknown>;
  };
  projectMembership: {
    findMany: (args: unknown) => Promise<unknown[]>;
    findUnique: (args: unknown) => Promise<unknown>;
    create: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
  };
}

const createReq=(overrides:Partial<mockRequest> = {}):mockRequest => ({
  params:{},
  body:{},
  user:{globalRole:'USER'},
  ...overrides,
})

const createRes=():mockResponse=>{
  const res: mockResponse = {
    statusCode:null,
    jsonPayload:null,
    status(code:number){
      this.statusCode=code;
      return this;
    },
    json(payload:unknown){
      this.jsonPayload = payload;
      return this;
    },
  };
  return res;
}

const createNext = () => {
  const calls: unknown[] = [];
  const next = (value?: unknown) => {
    calls.push(value);
  };

  return { next, calls };
};

test('getMembers returns the project members', async () => {
  prismaMock.project.findUnique = async() => ({id:7});
  prismaMock.projectMembership.findMany = async() => [{
    id:1,
    userId:11,
    projectId:7,
    role:'PROJECT_MEMBER',
    user: {
      id:11,
      email:'admin@taskboard.com',
      username:'admin',
    },
  }];
  const req = createReq({
    params:{projectId:'7'},
  });
  const res = createRes();
  const {next, calls} = createNext();
  await getMembers(req as never, res as never, next as never);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.jsonPayload, {
    members: [
      {
        id: 1,
        userId: 11,
        projectId: 7,
        role: 'PROJECT_MEMBER',
        email: 'admin@taskboard.com',
        username: 'admin',
      },
    ],
  });
  assert.deepEqual(calls, []);
});

