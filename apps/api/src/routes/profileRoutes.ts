import { Router } from 'express';
import { profileSchema } from '../../../../packages/validation/src/userValidation';
import { getProfile, upsertProfile } from '../controllers/profileController';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.get('/', requireAuth, getProfile);
router.put('/', requireAuth, validateBody(profileSchema), upsertProfile);

export default router;
