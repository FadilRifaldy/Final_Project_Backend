
import express from 'express';
import { createOrder, getUserOrders, getOrderDetail } from '../controllers/order.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = express.Router();

// Semua routes butuh authentication
router.use(verifyToken);

// POST /api/orders - Create order
router.post('/', createOrder);

// GET /api/orders - Get user's orders
router.get('/', getUserOrders);

// GET /api/orders/:orderId - Get order detail
router.get('/:orderId', getOrderDetail);

export default router;
