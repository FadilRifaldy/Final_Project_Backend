import { Request, Response, NextFunction } from "express";

export function checkRoles(roles: ("SUPER_ADMIN" | "STORE_ADMIN")[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Forbidden: insufficient access" });
    }

    next();
  };
}
