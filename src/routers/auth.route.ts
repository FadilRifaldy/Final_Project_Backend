import { Router } from "express";
import {register, login, logout, verifyTokenHandler, getDashboard} from "../controllers/auth.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { checkRoles } from "../middlewares/checkRole.middleware";

const route: Router = Router();

route.route("/register").post(register);
route.route("/login").post(login);
route.route("/logout").post(logout);
route.get("/verify-token", verifyToken, verifyTokenHandler);
route.get(
  "/dashboard",
  verifyToken,                        
  checkRoles(["SUPER_ADMIN", "STORE_ADMIN"]), 
  getDashboard
);

export default route;
