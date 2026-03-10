import {prisma} from '../../lib/prisma';

export const getUsername= async (id : number):Promise <string | null>=>{
    const obj= await prisma.user.findUnique(
        {
            where:{
                id
            }
        }
    );
    return obj?.username ?? null;
};