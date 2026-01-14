import { Router } from "express";
import discountController from "../controllers/discount.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { checkRoles } from "../middlewares/checkRole.middleware";

const router = Router();

// PUBLIC ROUTES (No Auth Required) 

router.get("/active", discountController.getActiveDiscounts);

// ADMIN ROUTES (Auth + Role Required) 

router.get(
    "/",
    verifyToken,
    checkRoles(["SUPER_ADMIN", "STORE_ADMIN"]),
    discountController.getAllDiscounts
);

router.get(
    "/:id",
    verifyToken,
    checkRoles(["SUPER_ADMIN", "STORE_ADMIN"]),
    discountController.getDiscountById
);

router.post(
    "/",
    verifyToken,
    checkRoles(["SUPER_ADMIN", "STORE_ADMIN"]), // Store Admin bisa buat discount untuk store mereka
    discountController.createDiscount
);

router.put(
    "/:id",
    verifyToken,
    checkRoles(["SUPER_ADMIN"]),
    discountController.updateDiscount
);

router.delete(
    "/:id",
    verifyToken,
    checkRoles(["SUPER_ADMIN"]),
    discountController.deleteDiscount
);

router.patch(
    "/:id/toggle",
    verifyToken,
    checkRoles(["SUPER_ADMIN", "STORE_ADMIN"]),
    discountController.toggleDiscountStatus
);

export default router;
