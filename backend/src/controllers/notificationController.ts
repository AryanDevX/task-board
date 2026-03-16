import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { RequiredExtensionArgs } from '@prisma/client/runtime/client.js';
import { AppError } from '../../types/appError.js';

export const getUserNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      next(new AppError('Unauthorized', 401));
    }
    const { userId } = req.user as { userId: number };
    const notifications = await prisma.notification.findMany({
      where: {
        userId: Number(userId),
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        task: { select: { title: true } },
      },
    });
    res.status(200).json({ notifications });
  } catch (error) {
    next(error);
  }
};

export const readNotfications = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { notificationId } = req.params;
    if (!req.user || !req.user.userId) {
      next(new AppError('Unauthorized', 401));
    }
    const { userId } = req.user as { userId: number };
    const notification = await prisma.notification.findUnique({
      where: {
        id: parseInt(notificationId),
      },
    });
    if (!notification || notification.userId !== userId) {
      return next(new AppError('Notification not found or unauthorized.', 404));
    }
    const updated = await prisma.notification.update({
      where: {
        id: parseInt(notificationId),
      },
      data: {
        isRead: true,
      },
    });
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};
