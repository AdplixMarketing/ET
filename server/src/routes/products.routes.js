import { Router } from 'express';
import { list, create, update, remove } from '../controllers/products.controller.js';
import authenticate from '../middleware/auth.js';
import { requirePro } from '../middleware/planGate.js';

const router = Router();

router.use(authenticate);
router.use(requirePro);

router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
