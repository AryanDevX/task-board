import { NextFunction, Request, Response } from 'express';
import {prisma} from '../../lib/prisma.js';
import jwt from 'jsonwebtoken';
import { AppError } from '../../types/appError.js';

const JWT_SECRET = process.env.JWT_SECRET as string;
interface JwtPayload {
  userId: number;
  globalRole: string;
}

export const authenticateJWT = (req:Request, res:Response, next:NextFunction) => {
  // Get auth header - The Authorization header is commonly used to send authentication tokens
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new AppError ("Authorization header missing",401));
  }

  // Extract token from "Bearer <token>"
  const token = authHeader.split(' ')[1];

  if (!token) {
    return next(new AppError("Token missing",401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Attach user to request
    req.user = decoded;

    next();
  } catch (err) {
    next(err)

  }
};
