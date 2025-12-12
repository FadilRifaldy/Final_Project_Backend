import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies.authToken;
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    req.user = decoded

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
