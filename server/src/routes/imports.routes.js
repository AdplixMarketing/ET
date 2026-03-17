import { Router } from 'express';
import { upload, uploadFile, setMapping, preview, execute, history, parse, executeDirectly } from '../controllers/imports.controller.js';
import authenticate from '../middleware/auth.js';
import { requireMax } from '../middleware/planGate.js';

const router = Router();

router.use(authenticate);
router.use(requireMax);

router.post('/parse', uploadFile, parse);
router.post('/execute', executeDirectly);
router.post('/', uploadFile, upload);
router.put('/:id/mapping', setMapping);
router.get('/:id/preview', preview);
router.post('/:id/execute', uploadFile, execute);
router.get('/history', history);

export default router;
