import { Router } from 'express';
import { registerSchema, loginSchema } from '../../../../packages/validation/src/userValidation';
import { register, login, logout, me } from '../controllers/authController';
import { validateBody } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
