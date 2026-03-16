import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../types/appError';
import { Prisma } from '@prisma/client';

export const createComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { content, taskId } = req.body;
    if (!req.user) {
      return next(new AppError('Unauthorized', 400));
    }
    const authorId = req.user.userId;
    if (!content || !taskId) {
      return next(new AppError('Task ID and content are required.', 400));
    }
    const newComment = await prisma.comment.create({
      data: {
        content,
        taskId: parseInt(taskId),
        authorId: authorId,
      },
      include: {
        author: { select: { id: true, username: true, avatar: true } },
      },
    });

    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId) },
      select: { assigneeId: true, title: true },
    });

    const notificationsToCreate: Prisma.NotificationCreateManyInput[] = [];
    const mentionMatches = content.match(/@([a-zA-Z0-9_]+)/g);
    if (mentionMatches) {
      const usernames = mentionMatches.map((match: string) =>
        match.substring(1),
      );
      const mentionedUsers = await prisma.user.findMany({
        where: {
          username: { in: usernames },
          id: { not: authorId },
        },
        select: {
          id: true,
        },
      });
      mentionedUsers.forEach((user) => {
        notificationsToCreate.push({
          userId: user.id,
          taskId: parseInt(taskId),
          type: 'USER_MENTIONED',
          message: `${newComment.author.username} mentioned you in a comment of "${task?.title}"`,
        });
      });
    }
    if (task && task.assigneeId && task.assigneeId !== authorId) {
      const alreadMentioned = notificationsToCreate.some(
        (n) => n.userId === task.assigneeId,
      );
      if (!alreadMentioned) {
        await prisma.notification.create({
          data: {
            userId: task.assigneeId,
            taskId: parseInt(taskId),
            type: 'COMMENT_ADDED',
            message: `Someone added a new comment to your task.`,
          },
        });
      }
    }
    if (notificationsToCreate.length > 0) {
      await prisma.notification.createMany({
        data: notificationsToCreate,
      });
    }
    await prisma.auditLog.create({
      data: {
        taskId: parseInt(taskId),
        userId: authorId,
        type: 'COMMENT_ADDED',
        newValue: newComment.id.toString(),
      },
    });
    res.status(201).json(newComment);
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    if (!req.user) {
      return next(new AppError('Unauthorized', 400));
    }
    const userId = req.user.userId;
    if (!content) {
      return next(new AppError('Content is required.', 400));
    }
    const existingComment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) },
    });
    if (!existingComment) {
      return next(new AppError('Comment not found.', 404));
    }
    if (existingComment.authorId !== userId) {
      return next(
        new AppError('Unauthorized: You can only edit your own comments.', 403),
      );
    }
    const updatedComment = await prisma.comment.update({
      where: { id: parseInt(commentId) },
      data: { content },
    });

    await prisma.auditLog.create({
      data: {
        taskId: existingComment.taskId,
        userId: userId,
        type: 'COMMENT_EDITED',
        oldValue: existingComment.content,
        newValue: content,
      },
    });
    res.status(200).json(updatedComment);
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.userId;
    const existingComment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) },
    });
    if (!existingComment) {
      return next(new AppError('Comment not found.', 404));
    }
    if (existingComment.authorId !== userId) {
      return next(
        new AppError(
          'Unauthorized: You can only delete your own comments.',
          403,
        ),
      );
    }
    const deletedComment = await prisma.comment.delete({
      where: {
        id: parseInt(commentId),
      },
    });
    await prisma.auditLog.create({
      data: {
        taskId: existingComment.taskId,
        userId: userId,
        type: 'COMMENT_DELETED',
        oldValue: existingComment.content,
      },
    });
    res
      .status(200)
      .json({ message: 'Comment deleted successfully', deletedComment });
  } catch (error) {
    next(error);
  }
};
