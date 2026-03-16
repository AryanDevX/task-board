import {  Request, Response } from 'express';
import { AppError } from '../../types/appError';

export const errorMiddleware = async (err:any,req:Request ,res:Response )=>{
  
  console.error(err);

  if (err instanceof AppError) {
    return res.status(err.status).json({
      message: err.message
    });
  }

  return res.status(500).json({
    message: "Internal Server Error"
  });
};