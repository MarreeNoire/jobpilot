import { Router } from 'express';
import { jobPreferenceSchema } from '../../../../packages/validation/src/userValidation';
import {
  getJobPreference,
  upsertJobPreference,
} from '../controllers/jobPreferenceController';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.get('/', requireAuth, getJobPreference);
router.put('/', requireAuth, validateBody(jobPreferenceSchema), upsertJobPreference);

export default router;
