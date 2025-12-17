import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { updateProfile } from "../controllers/updateProfile.controller";

const router = Router();

router.put("/profile", verifyToken, updateProfile);

export default router;
