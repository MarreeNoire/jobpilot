import { Router } from 'express';
import { resumeSchema } from '../../../../packages/validation/src/userValidation';
import {
  createResume,
  deleteResume,
  listResumes,
  setPrimaryResume,
} from '../controllers/resumeController';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.get('/', requireAuth, listResumes);
router.post('/', requireAuth, validateBody(resumeSchema), createResume);
router.patch('/:id/primary', requireAuth, setPrimaryResume);
router.delete('/:id', requireAuth, deleteResume);

export default router;
