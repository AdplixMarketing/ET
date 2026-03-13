import { Router } from 'express';
import { list, getOne, create, update, remove } from '../controllers/transactions.controller.js';
import authenticate from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import compressImage from '../middleware/compressImage.js';
import { checkTransactionLimit } from '../middleware/planGate.js';

const router = Router();

router.use(authenticate);
router.get('/', list);
router.get('/:id', getOne);
router.post('/', checkTransactionLimit, upload.single('receipt'), compressImage, create);
router.put('/:id', upload.single('receipt'), compressImage, update);
router.delete('/:id', remove);

export default router;
