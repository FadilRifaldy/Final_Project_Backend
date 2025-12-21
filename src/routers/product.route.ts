import { Router } from "express";
import productController from "../controllers/product.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { checkRoles } from "../middlewares/checkRole.middleware";

const router = Router();

router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);

// Protected routes (hanya SUPER_ADMIN)
router.post(
    "/",
    verifyToken,
    checkRoles(["SUPER_ADMIN"]),
    productController.createProduct
);

router.put(
    "/:id",
    verifyToken,
    checkRoles(["SUPER_ADMIN"]),
    productController.updateProduct
);

router.delete(
    "/:id",
    verifyToken,
    checkRoles(["SUPER_ADMIN"]),
    productController.deleteProduct
);

export default router;
