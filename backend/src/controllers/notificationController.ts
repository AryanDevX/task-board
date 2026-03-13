import { NextFunction, Request, Response } from 'express';
import {prisma} from '../../lib/prisma.js';
import { RequiredExtensionArgs } from '@prisma/client/runtime/client.js';

export const getUserNotifications = async (req: Request, res:Response, next: NextFunction): Promise<void> =>{
    try{
        const {userId} = (req as any).user.id;
        const notifications = await prisma.notification.findMany({
            where:{
                userId: parseInt(userId),
            },
            orderBy:{
                createdAt:'desc',
            },
            include:{
                task: {select:{title:true}},
            }
        });
        res.status(200).json({notifications});
    }
    catch(error){
        next(error);
    }
}

export const readNotfications = async (req: Request, res:Response, next:NextFunction):Promise<void>=>{
    try{
        const {notificationId} = req.params;
        const {userId} = (req as any).user.id;
        const notification = await prisma.notification.findUnique({
            where:{
                id:parseInt(notificationId),
            }
        });
        if(!notification || notification.userId!==userId){
            res.status(404).json({ error: "Notification not found or unauthorized." });
            return;
        }
        const updated = await prisma.notification.update({
            where:{
                id:parseInt(notificationId)
            },
            data:{
                isRead:true,
            },
        });
        res.status(200).json(updated);
    }
    catch(error){
        next(error);
    }
}

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;

        await prisma.notification.updateMany({
            where: { 
                userId: parseInt(userId),
                isRead: false 
            },
            data: { isRead: true }
        });

        res.status(200).json({ message: "All notifications marked as read." });
    } catch (error: any) {
        next(error);
    }
};