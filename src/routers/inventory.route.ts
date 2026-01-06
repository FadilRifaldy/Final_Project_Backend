import { Router } from "express";
import inventoryController from "../controllers/inventory.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { checkRoles } from "../middlewares/checkRole.middleware";

const router = Router();

// Public endpoint - untuk customer check stock availability
router.get(
    "/check/:storeId/:variantId",
    inventoryController.checkStockAvailability
);

// Protected endpoints - butuh authentication
router.use(verifyToken);

// GET endpoints - SUPER_ADMIN dan STORE_ADMIN
router.get(
    "/store/:storeId",
    checkRoles(["SUPER_ADMIN", "STORE_ADMIN"]),
    inventoryController.getInventoryByStore
);

// Get ALL variants with inventory (show stock 0 untuk variants tanpa inventory)
router.get(
    "/store/:storeId/all-variants",
    checkRoles(["SUPER_ADMIN", "STORE_ADMIN"]),
    inventoryController.getAllVariantsWithInventory
);

router.get(
    "/variant/:variantId",
    checkRoles(["SUPER_ADMIN"]), // Only Super Admin can see all stores
    inventoryController.getInventoryByVariant
);

router.get(
    "/detail/:storeId/:variantId",
    checkRoles(["SUPER_ADMIN", "STORE_ADMIN"]),
    inventoryController.getInventoryDetail
);

// POST endpoints - untuk reserve/release stock (internal use)
router.post(
    "/reserve",
    checkRoles(["SUPER_ADMIN", "STORE_ADMIN"]),
    inventoryController.reserveStock
);

router.post(
    "/release",
    checkRoles(["SUPER_ADMIN", "STORE_ADMIN"]),
    inventoryController.releaseReservedStock
);

export default router;
