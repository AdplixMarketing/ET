import { Router } from 'express';
import { list, getOne, create, update, remove } from '../controllers/templates.controller.js';
import authenticate from '../middleware/auth.js';
import { requireMax } from '../middleware/planGate.js';

const router = Router();

router.use(authenticate);
router.use(requireMax);

router.get('/', list);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
