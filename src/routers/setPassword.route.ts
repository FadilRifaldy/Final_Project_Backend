import { Router } from "express";
import { confirmPassword, sendPassLinkEmail, checkPasswordToken } from "../controllers/setPassword.controller";

const route: Router = Router();

route.post(
  "/password/send",
  sendPassLinkEmail
);

route.post("/password/confirm", confirmPassword)

route.get(
  "/password/check-token",
  checkPasswordToken
);

export default route;