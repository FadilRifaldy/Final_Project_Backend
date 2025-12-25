import { verifyToken } from "../middlewares/auth.middleware";
import { uploadSingle, uploadMultiple, handleUploadError } from "../middlewares/upload.middleware";
import productImageController from "../controllers/productImage.controller";
import { Router } from "express";

const router = Router();

router.post(
    "/:productId/images",
    verifyToken,
    uploadMultiple,
    handleUploadError,
    productImageController.uploadImages
)

export default router