interface JwtPayload {
  userId: number;
  globalRole: string;
}
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};