import { Router } from 'express';
import { getUsage } from '../controllers/usage.controller.js';
import authenticate from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', getUsage);

export default router;
