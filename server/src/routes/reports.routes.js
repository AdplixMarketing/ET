import { Router } from 'express';
import { pnl, exportCSV, exportPDF } from '../controllers/reports.controller.js';
import authenticate from '../middleware/auth.js';
import { requirePro } from '../middleware/planGate.js';

const router = Router();

router.use(authenticate);
router.get('/pnl', pnl);                          // Free: can view
router.get('/export/csv', requirePro, exportCSV);  // Pro only: export
router.get('/export/pdf', requirePro, exportPDF);  // Pro only: export

export default router;
