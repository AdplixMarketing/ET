import { Router } from 'express';
import { list, getOne, create, update, markSent, markPaid, downloadPDF, remove } from '../controllers/invoices.controller.js';
import authenticate from '../middleware/auth.js';
import { requirePro } from '../middleware/planGate.js';

const router = Router();

router.use(authenticate);
router.use(requirePro); // Invoicing is Pro only

router.get('/', list);
router.get('/:id', getOne);
router.get('/:id/pdf', downloadPDF);
router.post('/', create);
router.put('/:id', update);
router.post('/:id/send', markSent);
router.post('/:id/paid', markPaid);
router.delete('/:id', remove);

export default router;
