import { Router } from "express";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setPrimaryAddress
} from "../controllers/address.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const route: Router = Router();

route.use(verifyToken);

route.get("/", getAddresses);
route.post("/", createAddress);
route.put("/:id", updateAddress);
route.delete("/:id", deleteAddress);
route.patch("/:id/primary", setPrimaryAddress);

export default route;