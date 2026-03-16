import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../types/appError';

export const getTransitions = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { boardId } = req.params;
    const transitions = await prisma.workflowTransition.findMany({
      where: { boardId: parseInt(boardId) },
      include: {
        fromColumn: {
          select: { id: true, title: true },
        },
        toColumn: { select: { id: true, title: true } },
      },
    });
    res.status(200).json(transitions);
  } catch (error) {
    next(error);
  }
};

export const updateTransitions = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { boardId } = req.params;
    const { transitions } = req.body;
    if (!Array.isArray(transitions)) {
      return next(new AppError('Transitions must be an array', 400));
    }
    const board = await prisma.board.findUnique({
      where: { id: Number(boardId) },
      select: { projectId: true },
    });
    if (!board) {
      return next(new AppError('Board not found.', 404));
    }
    await prisma.$transaction(async (tx) => {
      await tx.workflowTransition.deleteMany({
        where: { boardId: Number(boardId) },
      });
      if (transitions.length > 0) {
        const dataToInsert = transitions.map((t) => ({
          projectId: board.projectId,
          boardId: Number(boardId),
          fromColumnId: t.fromColumnId,
          toColumnId: t.toColumnId,
        }));
        await tx.workflowTransition.createMany({
          data: dataToInsert,
          skipDuplicates: true,
        });
      }
    });
    const updatedTransitions = await prisma.workflowTransition.findMany({
      where: { boardId: Number(boardId) },
    });
    res.status(200).json({ updatedTransitions });
  } catch (error) {
    next(error);
  }
};
