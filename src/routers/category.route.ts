import { Router } from "express";
import categoryController from "../controllers/category.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { checkRoles } from "../middlewares/checkRole.middleware";

const router = Router();

/**
 * Category Routes
 * 
 * Public routes (no auth):
 * - GET /api/categories
 * - GET /api/categories/:id
 * 
 * Protected routes (Super Admin only):
 * - POST /api/categories
 * - PUT /api/categories/:id
 * - DELETE /api/categories/:id
 */

// Public routes - Anyone can view categories
router.get("/", categoryController.getAllCategories);
router.get("/:id", categoryController.getCategoryById);

// Protected routes - Super Admin only
router.post(
    "/",
    verifyToken,
    checkRoles(["SUPER_ADMIN"]),
    categoryController.createCategory
);

router.put(
    "/:id",
    verifyToken,
    checkRoles(["SUPER_ADMIN"]),
    categoryController.updateCategory
);

router.delete(
    "/:id",
    verifyToken,
    checkRoles(["SUPER_ADMIN"]),
    categoryController.deleteCategory
);

export default router;
