import { Router } from "express";
import voucherController from "../controllers/voucher.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { checkRoles } from "../middlewares/checkRole.middleware";

const router = Router();

// PUBLIC ROUTES (No Auth Required)
router.get("/active", voucherController.getActiveVouchers);
router.get("/code/:code", voucherController.getVoucherByCode);

// CUSTOMER ROUTES (Auth Required)
router.post(
    "/validate",
    verifyToken,
    voucherController.validateVoucherCode
);

router.post(
    "/:id/claim",
    verifyToken,
    voucherController.claimVoucher
);

router.get(
    "/user/:userId",
    verifyToken,
    voucherController.getUserVouchers
);

// ADMIN ROUTES (Auth + Role Required)
router.get(
    "/",
    verifyToken,
    checkRoles(["SUPER_ADMIN"]),
    voucherController.getAllVouchers
);

router.get(
    "/:id",
    verifyToken,
    checkRoles(["SUPER_ADMIN"]),
    voucherController.getVoucherById
);

router.post(
    "/",
    verifyToken,
    checkRoles(["SUPER_ADMIN"]), // Only Super Admin can create vouchers
    voucherController.createVoucher
);

router.put(
    "/:id",
    verifyToken,
    checkRoles(["SUPER_ADMIN"]),
    voucherController.updateVoucher
);

router.delete(
    "/:id",
    verifyToken,
    checkRoles(["SUPER_ADMIN"]),
    voucherController.deleteVoucher
);

router.patch(
    "/:id/toggle",
    verifyToken,
    checkRoles(["SUPER_ADMIN"]),
    voucherController.toggleVoucherStatus
);

export default router;
