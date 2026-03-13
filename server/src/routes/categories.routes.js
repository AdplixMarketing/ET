import { Router } from 'express';
import { list, create, update, remove } from '../controllers/categories.controller.js';
import authenticate from '../middleware/auth.js';
import { checkCategoryLimit } from '../middleware/planGate.js';

const router = Router();

router.use(authenticate);
router.get('/', list);
router.post('/', checkCategoryLimit, create);       // Pro only: custom categories
router.put('/:id', checkCategoryLimit, update);
router.delete('/:id', remove);

export default router;
