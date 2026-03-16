import { prisma } from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';
import { AppError } from '../../types/appError.js';
import { CreateColumnDTO, UpdateColumnDTO } from '../types/dtos.js';

//creating a column on a board:
export const createColumn = async(boardId: number, data: CreateColumnDTO) =>{
    const { title, order, wipLimit } = data;

    if(!title) throw new AppError("Column title is required.", 400);

    return await prisma.column.create({
        data: {
            title,
            boardId,
            order: order !== undefined ? Number(order) : 0,
            wipLimit: wipLimit ? Number(wipLimit) : null,
        },
    });
};

//fetching all columns for a board:
export const getColumnsByBoardId = async(boardId: number) =>{
    return await prisma.column.findMany({
        where: { boardId },
        orderBy: { order: 'asc' },
        include: {
            tasks: { orderBy: { order: 'asc' } },
        },
    });
};

//Updating column:
export const updateColumn = async(columnId: number, data: UpdateColumnDTO) =>{
    const { title, wipLimit, order } = data;

    const oldColumn = await prisma.column.findUnique({ where: { id: columnId } });
    if(!oldColumn) throw new AppError("Column not found.", 404);

    //Case 1: order changed
    if(order !== undefined && Number(order) !== oldColumn.order){
        const newOrderInt = Number(order);
        const oldOrderInt = oldColumn.order;

        // Using a transaction so "Either all columns safely shift or if fails then stop and update nothing.
        await prisma.$transaction(async(tx) =>{
            if(oldOrderInt < newOrderInt){
                // Moving column to the right so Shift intermediate columns left
                await tx.column.updateMany({
                    where: { boardId: oldColumn.boardId, order: { gt: oldOrderInt, lte: newOrderInt } },
                    data: { order: { decrement: 1 } }
                });
            }
            else{
                // Moving column to the left so shift intermediate columns right
                await tx.column.updateMany({
                    where: { boardId: oldColumn.boardId, order: { gte: newOrderInt, lt: oldOrderInt } },
                    data: { order: { increment: 1 } }
                });
            }

            //Updating target column:
            await tx.column.update({
                where: { id: columnId },
                data: {
                    title: title || oldColumn.title,
                    wipLimit: wipLimit !== undefined ? (wipLimit ? Number(wipLimit) : null) : oldColumn.wipLimit,
                    order: newOrderInt
                }
            });
        });

        return await prisma.column.findUnique({
            where: { id: columnId },
            include: { tasks: { orderBy: { order: 'asc' } } }
        });
    }

    // Case 2: Order did not change
    return await prisma.column.update({
        where: { id: columnId },
        include: { tasks: { orderBy: { order: 'asc' } } },
        data: {
            title,
            wipLimit: wipLimit !== undefined ? (wipLimit ? Number(wipLimit) : null) : undefined,
        },
    });
};

//Deleting a column:
export const deleteColumn = async(columnId: number) =>{
    try{
        return await prisma.column.delete({
            where: { id: columnId },
        });
    }
    catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                throw new AppError("Record not found.", 404);
            }
        }
        throw error;
    }
};
