import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { sendEmailVerification, resendEmailVerification, verifyEmail, confirmEmailVerification } from "../controllers/emailVerif.controller";

const route: Router = Router();

route.post(
  "/send",
  verifyToken,
  sendEmailVerification
);
route.get("/verify-email", verifyEmail);

route.post(
  "/resend",
  verifyToken,
  resendEmailVerification
);

route.post("/confirm-email", confirmEmailVerification);

export default route;