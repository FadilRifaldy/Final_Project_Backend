import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { checkRoles } from "../middlewares/checkRole.middleware";
import productVariantController from "../controllers/productVariant.controller";

const router = Router()

router.get(
    "/all/:productId",
    productVariantController.getVariantsByProduct
)
router.post(
    "/:productId",
    verifyToken,
    checkRoles(["SUPER_ADMIN"]),
    productVariantController.createVariant
);

export default router
