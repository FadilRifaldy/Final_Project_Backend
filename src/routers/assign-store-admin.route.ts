import { Router } from "express";
import {
  getStoreAdmins,
  getAvailableStores,
  assignStoreToAdmin,
  unassignStoreFromAdmin,
} from "../controllers/assign-store-admin.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { checkRoles } from "../middlewares/checkRole.middleware";

const router = Router();

router.use(verifyToken);
router.use(checkRoles(["SUPER_ADMIN"]));
router.get("/", getStoreAdmins);
router.get("/available-stores", getAvailableStores);
router.put("/:userId", assignStoreToAdmin);
router.delete("/:userId", unassignStoreFromAdmin);

export default router;