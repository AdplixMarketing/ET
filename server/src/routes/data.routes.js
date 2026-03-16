import { Router } from 'express';
import { exportData } from '../controllers/data.controller.js';
import authenticate from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/export', exportData);

export default router;
