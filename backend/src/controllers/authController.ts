import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import {prisma} from '../../lib/prisma';
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

// Register
export const registerUser = async (req: Request, res: Response) => {
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
      return res.status(400).json({
        message: "Username or email already exists"
      });
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

  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
};

// Login
  export const loginUser = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
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

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


export const refreshUser= async (req:Request,res:Response)=>{
  try{
  const refreshToken=req.cookies.refreshToken;
  if(!refreshToken) {res.status(401).json({message:"Refresh Token missing"});}

  const payload=jwt.verify(refreshToken,JWT_SECRET) as JwtPayload;

  const dbtoken =await prisma.refreshToken.findUnique({
    where:{token:refreshToken}
  });
  
  if(!dbtoken) {res.status(403).json({message:"Token revoked "});}

 
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
  res.status(500).json({ message: "Server error" });
 }
};

export const logoutUser = async (req:Request ,res:Response )=>{
try{
 const token = req.cookies.refreshToken

 await prisma.refreshToken.delete({
   where:{token}
 })

 res.clearCookie("accessToken")
 res.clearCookie("refreshToken")

 res.json({message:"logged out"})}
 
 catch(err){
  res.status(500).json({ message: "Server error" });
 }
};