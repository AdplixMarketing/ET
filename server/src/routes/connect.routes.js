import { Router } from 'express';
import { createAccount, createOnboardingLink, getStatus } from '../controllers/connect.controller.js';
import authenticate from '../middleware/auth.js';
import { requireMax } from '../middleware/planGate.js';

const router = Router();

router.use(authenticate);
router.use(requireMax);

router.post('/account', createAccount);
router.post('/onboarding-link', createOnboardingLink);
router.get('/status', getStatus);

export default router;
