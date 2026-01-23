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
  console.log("next request hit the middleware")
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
    console.log("request passed from the middleware")
    next();
  } catch {
    return res.status(403).json({ message: "unauthorized" });
  }
}
