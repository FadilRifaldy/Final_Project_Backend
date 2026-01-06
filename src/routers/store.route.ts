import { Router } from "express";
import { createStore, getStores } from "../controllers/store.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { checkRoles } from "../middlewares/checkRole.middleware";

const router = Router();

router.get("/get-stores", getStores);
router.post("/create-store", verifyToken, checkRoles(["SUPER_ADMIN", "STORE_ADMIN"]), createStore);

export default router;