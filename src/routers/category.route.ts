import { Router } from "express";
import categoryController from "../controllers/category.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { checkRoles } from "../middlewares/checkRole.middleware";

const router = Router();

router.get("/", categoryController.getAllCategories);
router.get("/:id", categoryController.getCategoryById);

// Super Admin only
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
