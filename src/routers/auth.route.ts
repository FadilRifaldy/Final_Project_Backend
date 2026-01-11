import { Router } from "express";
import {register, login, logout, verifyTokenHandler, getDashboard, getMe, registerStoreAdmin} from "../controllers/auth.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { checkRoles } from "../middlewares/checkRole.middleware";
import { socialLogin } from "../controllers/auth.controller";

const route: Router = Router();

route.route("/register").post(register);
route.route("/register-store").post(registerStoreAdmin)
route.route("/login").post(login);
route.route("/logout").post(logout);
route.get("/verify-token", verifyToken, verifyTokenHandler);
route.get(
  "/dashboard",
  verifyToken,                        
  checkRoles(["SUPER_ADMIN", "STORE_ADMIN"]), 
  getDashboard
);
route.get("/me", verifyToken, getMe);
route.post("/social-login", socialLogin);

export default route;
