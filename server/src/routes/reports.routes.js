import { Router } from 'express';
import { pnl, exportCSV, exportPDF, cashFlow, taxSummary, expenseTrends, revenueByClient, periodComparison } from '../controllers/reports.controller.js';
import authenticate from '../middleware/auth.js';
import { requirePro, requireMax } from '../middleware/planGate.js';

const router = Router();

router.use(authenticate);
router.get('/pnl', pnl);                          // Free: can view
router.get('/export/csv', requirePro, exportCSV);  // Pro only: export
router.get('/export/pdf', requirePro, exportPDF);  // Pro only: export

// Max-only advanced reports
router.get('/cash-flow', requireMax, cashFlow);
router.get('/tax-summary', requireMax, taxSummary);
router.get('/expense-trends', requireMax, expenseTrends);
router.get('/revenue-by-client', requireMax, revenueByClient);
router.get('/period-comparison', requireMax, periodComparison);

export default router;
