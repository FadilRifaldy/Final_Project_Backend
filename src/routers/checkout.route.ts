import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import {
  getUserAddresses,
  calculateShippingCost,
} from '../controllers/checkout.controller';

const router = Router();

// Apply auth middleware to all routes
router.use(verifyToken);

router.get('/addresses', getUserAddresses);
router.post('/shipping-cost', calculateShippingCost);

export default router;