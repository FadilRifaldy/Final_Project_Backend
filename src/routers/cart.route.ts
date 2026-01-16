import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import * as cartController from "../controllers/cart.controller";

const router = Router();

// All cart routes require authentication
router.use(verifyToken);

// GET /cart - Get user's cart
router.get("/", cartController.getCart);

// POST /cart - Add item to cart
router.post("/", cartController.addItemToCart);

// PUT /cart/:itemId - Update cart item quantity
router.put("/:itemId", cartController.updateCartItem);

// DELETE /cart/:itemId - Remove item from cart
router.delete("/:itemId", cartController.deleteCartItem);

// DELETE /cart - Clear all items
router.delete("/", cartController.clearUserCart);

// POST /cart/validate - Validate cart before checkout
router.post("/validate", cartController.validateUserCart);

export default router;
