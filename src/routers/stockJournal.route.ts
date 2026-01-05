import { Router } from "express";
import stockJournalController from "../controllers/stockJournal.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { checkRoles } from "../middlewares/checkRole.middleware";

const router = Router();
router.use(verifyToken);

// POST endpoints - hanya SUPER_ADMIN dan STORE_ADMIN
router.post(
    "/in",
    checkRoles(["SUPER_ADMIN", "STORE_ADMIN"]),
    stockJournalController.createStockIn
);

router.post(
    "/out",
    checkRoles(["SUPER_ADMIN", "STORE_ADMIN"]),
    stockJournalController.createStockOut
);

// GET endpoints - SUPER_ADMIN dan STORE_ADMIN
router.get(
    "/variant/:storeId/:variantId",
    checkRoles(["SUPER_ADMIN", "STORE_ADMIN"]),
    stockJournalController.getStockHistory
);

router.get(
    "/store/:storeId",
    checkRoles(["SUPER_ADMIN", "STORE_ADMIN"]),
    stockJournalController.getStockHistoryByStore
);

router.get(
    "/:id",
    checkRoles(["SUPER_ADMIN", "STORE_ADMIN"]),
    stockJournalController.getStockJournalById
);

export default router;
