import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { uploadResumeFile } from '../controllers/resumeUploadController';

const router = Router();

router.post('/', requireAuth, uploadResumeFile);

export default router;
