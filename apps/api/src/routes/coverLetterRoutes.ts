import { Router } from 'express';
import { coverLetterSchema } from '../../../../packages/validation/src/userValidation';
import {
  listCoverLetters,
  createCoverLetter,
  updateCoverLetter,
  deleteCoverLetter,
} from '../controllers/coverLetterController';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.get('/', requireAuth, listCoverLetters);
router.post('/', requireAuth, validateBody(coverLetterSchema), createCoverLetter);
router.put('/:id', requireAuth, validateBody(coverLetterSchema), updateCoverLetter);
router.delete('/:id', requireAuth, deleteCoverLetter);

export default router;
