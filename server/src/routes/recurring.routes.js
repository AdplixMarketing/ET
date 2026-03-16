import { Router } from 'express';
import { list, getOne, create, update, toggleActive, remove } from '../controllers/recurring.controller.js';
import authenticate from '../middleware/auth.js';
import { requireMax } from '../middleware/planGate.js';

const router = Router();

router.use(authenticate);
router.use(requireMax);

router.get('/', list);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.post('/:id/toggle', toggleActive);
router.delete('/:id', remove);

export default router;
