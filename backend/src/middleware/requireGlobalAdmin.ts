import { Request,Response,NextFunction } from "express";
export const requireGlobalAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.globalRole !== "GLOBAL_ADMIN") {
    return res.status(403).json({ message: "Global admin access required" });
  }

  next();
};