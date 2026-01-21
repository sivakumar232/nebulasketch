import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import {JWT_SECRET} from "@repo/backend-common/config"
interface AuthTokenPayload {
  userId: string;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ message: "unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  if(!token){
    return res.status(403).json({ message: "unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as AuthTokenPayload;
    req.userId = decoded.userId; 
    next();
  } catch {
    return res.status(403).json({ message: "unauthorized" });
  }
}
