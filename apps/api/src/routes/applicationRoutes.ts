import { Router } from 'express';
import {
  acceptApplicationSchema,
  applicationSchema,
  createInterviewSchema,
  updateApplicationRecruiterNoteSchema,
  updateApplicationStatusSchema,
} from '../../../../packages/validation/src/userValidation';
import {
  acceptApplication,
  createApplication,
  getApplicationDetail,
  getRecruiterApplicationsOverview,
  listApplicationInterviews,
  listRecruiterApplications,
  listApplications,
  listApplicationsForJob,
  updateApplicationStatus,
  updateRecruiterNote,
  createApplicationInterview,
} from '../controllers/applicationController';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

// Candidat : liste de ses propres candidatures
router.get('/', requireAuth, listApplications);

// Recruteur : vue d'ensemble du pipeline (toutes offres confondues) pour le tableau de bord
router.get('/recruiter/overview', requireAuth, getRecruiterApplicationsOverview);
router.get('/recruiter', requireAuth, listRecruiterApplications);

// Recruteur : pipeline/Kanban des candidatures recues pour une offre donnee
router.get('/job/:jobId', requireAuth, listApplicationsForJob);

// Recruteur : fiche detaillee d'une candidature (profil complet du candidat)
router.get('/:id', requireAuth, getApplicationDetail);
router.get('/:id/interviews', requireAuth, listApplicationInterviews);

router.post('/', requireAuth, validateBody(applicationSchema), createApplication);

// Changement de statut : accessible au candidat (ses candidatures) et au
// recruteur (candidatures recues sur ses offres) - voir le controleur.
router.patch('/:id/status', requireAuth, validateBody(updateApplicationStatusSchema), updateApplicationStatus);

// Recruteur : note interne (jamais visible par le candidat)
router.patch('/:id/notes', requireAuth, validateBody(updateApplicationRecruiterNoteSchema), updateRecruiterNote);
router.post('/:id/interviews', requireAuth, validateBody(createInterviewSchema), createApplicationInterview);

// Recruteur : validation definitive + promesse d'embauche / message de confirmation
router.patch('/:id/accept', requireAuth, validateBody(acceptApplicationSchema), acceptApplication);

export default router;
