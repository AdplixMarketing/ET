import { Router } from 'express';
import { list, getOne, create, update, linkTransactions, remove } from '../controllers/clients.controller.js';
import authenticate from '../middleware/auth.js';
import { requireMax } from '../middleware/planGate.js';

const router = Router();

router.use(authenticate);
router.use(requireMax);

router.get('/', list);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.post('/:id/link-transactions', linkTransactions);
router.delete('/:id', remove);

export default router;
