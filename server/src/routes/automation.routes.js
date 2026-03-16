import { Router } from 'express';
import { list, create, update, remove } from '../controllers/automation.controller.js';
import authenticate from '../middleware/auth.js';
import { requireMax } from '../middleware/planGate.js';

const router = Router();

router.use(authenticate);
router.use(requireMax);

router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
