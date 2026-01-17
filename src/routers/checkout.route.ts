import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import {
  getUserAddresses,
  calculateShippingCost,
  createOrder,
} from '../controllers/checkout.controller';

const router = Router();

// Apply auth middleware to all routes
router.use(verifyToken);

router.get('/addresses', getUserAddresses);
router.post('/shipping-cost', calculateShippingCost);
router.post('/create-order', createOrder);

export default router;
