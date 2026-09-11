import { Router } from 'express';
import authRoutes from './authRoutes';
import notificationRoutes from './notificationRoutes';
import profileRoutes from './profileRoutes';
import jobPreferenceRoutes from './jobPreferenceRoutes';
import resumeRoutes from './resumeRoutes';
import resumeUploadRoutes from './resumeUploadRoutes';
import jobRoutes from './jobRoutes';
import applicationRoutes from './applicationRoutes';
import coverLetterRoutes from './coverLetterRoutes';
import automationRuleRoutes from './automationRuleRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/notifications', notificationRoutes);
router.use('/profile', profileRoutes);
router.use('/job-preferences', jobPreferenceRoutes);
router.use('/resumes', resumeRoutes);
router.use('/resume-uploads', resumeUploadRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/cover-letters', coverLetterRoutes);
router.use('/automation-rules', automationRuleRoutes);
router.use('/admin', adminRoutes);

export default router;
