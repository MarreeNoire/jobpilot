import { Router } from 'express';
import { registerSchema, loginSchema, otpRequestSchema, otpVerifySchema } from '../../../../packages/validation/src/userValidation';
import { register, login, logout, me } from '../controllers/authController';
import { requestOtp, verifyOtp } from '../controllers/otpController';
import { githubLogin, githubCallback } from '../controllers/githubAuthController';
import { validateBody } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

router.post('/otp/request', validateBody(otpRequestSchema), requestOtp);
router.post('/otp/verify', validateBody(otpVerifySchema), verifyOtp);

router.get('/github', githubLogin);
router.get('/github/callback', githubCallback);

export default router;
