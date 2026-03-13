import { Router } from 'express';
import { createCheckout, getSubscription, cancelSubscription } from '../controllers/billing.controller.js';
import authenticate from '../middleware/auth.js';

const router = Router();

router.get('/subscription', authenticate, getSubscription);
router.post('/checkout', authenticate, createCheckout);
router.post('/cancel', authenticate, cancelSubscription);

export default router;
