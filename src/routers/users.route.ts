import { Router } from "express";
import usersController from "../controllers/users.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { checkRoles } from "../middlewares/checkRole.middleware";

const router = Router();

router.get("/", verifyToken, checkRoles(["SUPER_ADMIN"]), usersController.getAllUsers);
router.get("/:id", verifyToken, checkRoles(["SUPER_ADMIN"]), usersController.getUserById);
router.delete("/:id", verifyToken, checkRoles(["SUPER_ADMIN"]), usersController.deleteUser);

export default router;
