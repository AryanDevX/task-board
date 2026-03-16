import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../types/appError.js';
import * as taskService from '../services/taskService.js';
import { MoveTaskDTO } from '../types/dtos.js';

export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user || !req.user.userId)
      return next(new AppError('Unauthorized', 401));

    const newTask = await taskService.createTask(req.body, req.user.userId);

    res.status(201).json(newTask);
  } catch (error) {
    next(error); // Passes errors to central error handling middleware
  }
};

export const getTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { taskId } = req.params;
    if (!taskId) return next(new AppError('Task ID is required.', 400));

    const taskData = await taskService.getTaskWithTimeline(parseInt(taskId));

    res.status(200).json(taskData);
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { taskId } = req.params;
    if (!req.user || !req.user.userId)
      return next(new AppError('Unauthorized', 401));

    const updatedTask = await taskService.updateTask(
      parseInt(taskId),
      req.body,
      req.user.userId,
    );

    res.status(200).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

export const moveTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
      if (!req.user || !req.user.userId) {
      return next(new AppError('Missing user authentication', 401));
    }
    const { taskId, userId } = req.params;

const { targetColumnId, newOrder } = req.body;
    const updatedTask = await taskService.moveTask(
      parseInt(taskId),
      {targetColumnId , newOrder } as MoveTaskDTO,
      req.user.userId,
    );

    res.status(200).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { taskId } = req.params;
    if (!req.user || !req.user.userId)
      return next(new AppError('Unauthorized', 401));
    if (!taskId) return next(new AppError('Task ID is required.', 400));

    const deletedTask = await taskService.deleteTask(
      parseInt(taskId),
      req.user.userId,
    );

    res.status(200).json({ message: 'Task deleted successfully', deletedTask });
  } catch (error) {
    next(error);
  }
};
