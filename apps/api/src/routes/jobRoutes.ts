import { Router } from 'express';
import { jobSchema, updateJobStatusSchema } from '../../../../packages/validation/src/userValidation';
import {
  createJob,
  getJobById,
  listJobs,
  listMyJobs,
  syncEducarriereJobsManually,
  updateJobStatus,
} from '../controllers/jobController';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.get('/', requireAuth, listJobs);
router.get('/mine', requireAuth, listMyJobs);
router.get('/:id', requireAuth, getJobById);
router.post('/', requireAuth, validateBody(jobSchema), createJob);
router.patch('/:id/status', requireAuth, validateBody(updateJobStatusSchema), updateJobStatus);
router.post('/sync-educarriere', requireAuth, syncEducarriereJobsManually);

export default router;
