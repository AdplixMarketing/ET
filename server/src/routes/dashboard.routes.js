import { Router } from 'express';
import { summary, chart, recent } from '../controllers/dashboard.controller.js';
import authenticate from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/summary', summary);
router.get('/chart', chart);
router.get('/recent', recent);

export default router;
