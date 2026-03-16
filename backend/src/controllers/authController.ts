import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import {prisma} from '../../lib/prisma.js';
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import { AppError } from '../../types/appError.js';

const JWT_SECRET = process.env.JWT_SECRET as string;

// Register
export const registerUser = async (req: Request, res: Response,next:NextFunction):Promise<void> => {
  const { username, email, password } = req.body;

  try {
    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: email }
        ]
      }
    });

    if (existingUser) {
      return next(new AppError("Username or email already exists",400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Create user
    const newUser = await prisma.user.create({
      data: {
        username: username,
        email: email,
        password: hashedPassword,
        globalRole: "USER"   // default role
      }
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        globalRole: newUser.globalRole
      }
    });

  } catch (err) {
    next(err);
  }
};

// Login
  export const loginUser = async (req: Request, res: Response,next:NextFunction):Promise<void> => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return next(new AppError ("Invalid username or password", 400)) ;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return next(new AppError ("Invalid username or password", 400));
    }

    const token = jwt.sign(
      {
        userId: user.id,
        globalRole: user.globalRole
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken= jwt.sign(
      {
        userId: user.id,
        globalRole: user.globalRole
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    prisma.refreshToken.create({
      data:{
        userId:user.id,
        token:token,
        expiresAt:new Date(Date.now() + 7*24*60*60*1000)
      }
    });

   res.cookie("accessToken", token, {
  httpOnly: true,
  secure: true
})

res.cookie("refreshToken", refreshToken, {
  httpOnly: true,
  secure: true
})

  } catch (err) {
    next(err);
  }
};


export const refreshUser= async (req:Request,res:Response,next:NextFunction):Promise<void>=>{
  try{
  const refreshToken=req.cookies.refreshToken;
  if(!refreshToken) { return next(new AppError("Refresh Token missing",401));}

  const payload=jwt.verify(refreshToken,JWT_SECRET) as JwtPayload;

  const dbtoken =await prisma.refreshToken.findUnique({
    where:{token:refreshToken}
  });
  
  if(!dbtoken) { return next(new AppError("Token revoked", 403));}

 const accessToken = jwt.sign(
   { userId: payload.userId,
    globalRole: payload.globalRole
    },
   JWT_SECRET!,
   { expiresIn: "1h" }
 );

 res.cookie("accessToken", accessToken, { httpOnly:true });

 res.json({message:"token refreshed"});}

 catch(err){
  next(err);
 }
};

export const logoutUser = async (req:Request ,res:Response ,next:NextFunction):Promise<void>=>{
try{
 const token = req.cookies.refreshToken

 await prisma.refreshToken.delete({
   where:{token}
 })

 res.clearCookie("accessToken")
 res.clearCookie("refreshToken")

 res.json({message:"logged out"})}
 
 catch(err){
  next(err);
 }
};