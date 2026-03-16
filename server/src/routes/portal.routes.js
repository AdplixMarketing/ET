import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getInvoice, createPayment } from '../controllers/portal.controller.js';

const router = Router();

// Rate limit payment attempts: 10 per invoice per hour
const portalPaymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many payment attempts. Please try again later.' },
});

// Public routes - no auth required
router.get('/:token', getInvoice);
router.post('/:token/pay', portalPaymentLimiter, createPayment);

export default router;
