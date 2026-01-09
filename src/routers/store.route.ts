import { Router } from "express";
import {
  createStore,
  getStores,
  getStoreById,
  updateStore,
  deleteStore,
} from "../controllers/store.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { checkRoles } from "../middlewares/checkRole.middleware";

const router = Router();

router.get("/", getStores);

router.get("/:id", getStoreById);

router.post(
  "/create",
  verifyToken,
  checkRoles(["SUPER_ADMIN"]),
  createStore
);

router.put(
  "/update/:id",
  verifyToken,
  checkRoles(["SUPER_ADMIN"]),
  updateStore
);

router.delete(
  "/delete/:id",
  verifyToken,
  checkRoles(["SUPER_ADMIN"]),
  deleteStore
);

export default router;