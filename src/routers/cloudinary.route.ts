import { Router } from "express";
import { getUploadSignature } from "../controllers/cloudinary.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.get("/signature", verifyToken, getUploadSignature);

export default router;
