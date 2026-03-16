import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../types/appError.js';
import { prisma } from '../../lib/prisma.js';

export const getUsers = (req: Request, res: Response) => {
  res.status(200).json({ message: 'Successfully fetched the users!' });
};

export const updateAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;

    if (!req.file) {
      return next(new AppError('No file uploaded', 400));
    }
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    });

    res.status(200).json({
      message: 'Avatar updated',
      avatar: user.avatar,
    });
  } catch (err) {
    next(err);
  }
};
