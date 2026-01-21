import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

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
    const decoded = jwt.verify(token, "secret") as unknown as AuthTokenPayload;
    req.userId = decoded.userId; // ✅
    next();
  } catch {
    return res.status(403).json({ message: "unauthorized" });
  }
}
