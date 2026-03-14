import { Router } from 'express';
import { scan } from '../controllers/ocr.controller.js';
import authenticate from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { checkScanLimit } from '../middleware/planGate.js';

const router = Router();

router.use(authenticate);
router.post('/scan', checkScanLimit, upload.single('receipt'), scan);

export default router;
