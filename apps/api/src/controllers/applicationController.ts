import { Response } from 'express';
import { prisma } from '../../../../packages/database/src/index';
import {
  acceptApplicationSchema,
  applicationSchema,
  createInterviewSchema,
  updateApplicationRecruiterNoteSchema,
  updateApplicationStatusSchema,
} from '../../../../packages/validation/src/userValidation';
import type { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth';
import {
  notifyApplicationStatusChange,
  notifyInterviewScheduled,
  notifyNewApplication,
  notifyRecruiterApplicationEvent,
} from '../services/notificationService';

const JOB_SELECT = {
  id: true,
  title: true,
  company: true,
  platform: true,
  url: true,
  postedByUserId: true,
} as const;

const CANDIDATE_ALLOWED_STATUSES = new Set(['DRAFT', 'PENDING', 'PROCESSING', 'WAITING_USER', 'SUBMITTED']);

// Le candidat peut retirer sa candidature (statut REJECTED) uniquement
// tant qu'elle est encore active dans le pipeline recruteur.
const CANDIDATE_WITHDRAWABLE_FROM = new Set(['SUBMITTED', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW_SCHEDULED']);

const RECRUITER_TECHNICAL_STATUSES = new Set([
  'DRAFT',
  'PROCESSING',
  'WAITING_USER',
  'FAILED',
]);

const RECRUITER_ACTIVE_STATUSES = new Set([
  'PENDING',
  'SUBMITTED',
  'REVIEWING',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
]);

const RECRUITER_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  PENDING: ['REVIEWING', 'REJECTED'],
  SUBMITTED: ['REVIEWING', 'REJECTED'],
  REVIEWING: ['SHORTLISTED', 'REJECTED'],
  SHORTLISTED: ['INTERVIEW_SCHEDULED', 'REJECTED'],
  INTERVIEW_SCHEDULED: ['REJECTED'],
};

function isAllowedRecruiterStatusTransition(fromStatus: string, toStatus: string): boolean {
  if (fromStatus === toStatus) {
    return true;
  }

  return RECRUITER_STATUS_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false;
}

function toApplicationResponse(application: {
  id: string;
  userId: string;
  jobId: string;
  resumeId: string | null;
  coverLetterId: string | null;
  status: string;
  compatibilityScore: number | null;
  hiringMessage: string | null;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  automationLog?: { id: string } | null;
  job?: {
    id: string;
    title: string;
    company: string;
    platform: string;
    url: string;
    postedByUserId?: string | null;
  };
}) {
  const { job, ...rest } = application;
  const publicJob = job
    ? {
        id: job.id,
        title: job.title,
        company: job.company,
        platform: job.platform,
        url: job.url,
      }
    : undefined;

  return {
    ...rest,
    job: publicJob,
    submittedAt: application.submittedAt?.toISOString() ?? null,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
    source: application.automationLog ? 'AUTOMATIC' : 'MANUAL',
  };
}

/**
 * Reponse pour la vue recruteur (Kanban) : inclut la note interne et les
 * coordonnees minimales du candidat, sans exposer le mot de passe.
 */
function toRecruiterApplicationResponse(application: {
  id: string;
  userId: string;
  jobId: string;
  resumeId: string | null;
  coverLetterId: string | null;
  status: string;
  compatibilityScore: number | null;
  recruiterNotes: string | null;
  hiringMessage: string | null;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  resume: { id: string; title: string; fileUrl: string | null; fileName: string | null } | null;
  coverLetter: { id: string; title: string } | null;
}) {
  return {
    id: application.id,
    userId: application.userId,
    jobId: application.jobId,
    resumeId: application.resumeId,
    coverLetterId: application.coverLetterId,
    status: application.status,
    compatibilityScore: application.compatibilityScore,
    recruiterNotes: application.recruiterNotes,
    hiringMessage: application.hiringMessage,
    submittedAt: application.submittedAt?.toISOString() ?? null,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
    candidate: application.user,
    resume: application.resume,
    coverLetter: application.coverLetter,
  };
}

export async function listApplications(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (req.userRole !== 'CANDIDATE') {
    res.status(403).json({ error: 'Candidate access required' });
    return;
  }

  const applications = await prisma.application.findMany({
    where: { userId: req.userId },
    include: {
      job: { select: JOB_SELECT },
      automationLog: { select: { id: true } },
    },
    orderBy: [{ updatedAt: 'desc' }],
  });

  res.status(200).json({ applications: applications.map(toApplicationResponse) });
}

/**
 * Kanban / pipeline recruteur : liste toutes les candidatures recues pour
 * une offre precise, avec les informations essentielles du candidat.
 */
export async function listApplicationsForJob(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (req.userRole !== 'RECRUITER') {
    res.status(403).json({ error: 'Recruiter access required' });
    return;
  }

  const { jobId } = req.params;

  const job = await prisma.job.findUnique({ where: { id: jobId } });

  if (!job || job.postedByUserId !== req.userId) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  const applications = await prisma.application.findMany({
    where: { jobId },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      },
      resume: { select: { id: true, title: true, fileUrl: true, fileName: true } },
      coverLetter: { select: { id: true, title: true } },
    },
    orderBy: [{ updatedAt: 'desc' }],
  });

  res.status(200).json({
    job: { id: job.id, title: job.title, company: job.company },
    applications: applications.map(toRecruiterApplicationResponse),
  });
}

/**
 * Liste globale du pipeline recruteur. Le filtre par relation garantit qu'un
 * recruteur ne peut voir que les candidatures de ses propres offres.
 */
export async function listRecruiterApplications(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (req.userRole !== 'RECRUITER') {
    res.status(403).json({ error: 'Recruiter access required' });
    return;
  }

  const applications = await prisma.application.findMany({
    where: { job: { postedByUserId: req.userId } },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      },
      resume: { select: { id: true, title: true, fileUrl: true, fileName: true } },
      coverLetter: { select: { id: true, title: true } },
      job: { select: { id: true, title: true, company: true } },
    },
    orderBy: [{ updatedAt: 'desc' }],
  });

  res.status(200).json({
    applications: applications.map((application) => ({
      ...toRecruiterApplicationResponse(application),
      job: application.job,
    })),
  });
}

/**
 * Fiche detaillee d'un candidat pour une candidature donnee : CV, lettre de
 * motivation, competences, parcours (experiences/formations), coordonnees.
 */
export async function getApplicationDetail(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (req.userRole !== 'RECRUITER') {
    res.status(403).json({ error: 'Recruiter access required' });
    return;
  }

  const { id } = req.params;

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      job: { select: JOB_SELECT },
      resume: true,
      coverLetter: true,
      interviews: { orderBy: { scheduledAt: 'asc' } },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          actor: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          profile: true,
          experiences: { orderBy: { startDate: 'desc' } },
          educations: { orderBy: { startDate: 'desc' } },
          skills: true,
        },
      },
    },
  });

  if (!application || application.job.postedByUserId !== req.userId) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  res.status(200).json({
    application: {
      id: application.id,
      status: application.status,
      compatibilityScore: application.compatibilityScore,
      recruiterNotes: application.recruiterNotes,
      hiringMessage: application.hiringMessage,
      submittedAt: application.submittedAt?.toISOString() ?? null,
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
      job: {
        id: application.job.id,
        title: application.job.title,
        company: application.job.company,
      },
      resume: application.resume,
      coverLetter: application.coverLetter,
      candidate: {
        id: application.user.id,
        firstName: application.user.firstName,
        lastName: application.user.lastName,
        email: application.user.email,
        phone: application.user.phone,
        profile: application.user.profile,
        experiences: application.user.experiences,
        educations: application.user.educations,
        skills: application.user.skills,
      },
      interviews: application.interviews.map((interview) => ({
        ...interview,
        scheduledAt: interview.scheduledAt.toISOString(),
        createdAt: interview.createdAt.toISOString(),
        updatedAt: interview.updatedAt.toISOString(),
      })),
      activities: application.activities.map((activity) => ({
        id: activity.id,
        applicationId: activity.applicationId,
        actorUserId: activity.actorUserId,
        actor: activity.actor,
        type: activity.type,
        fromStatus: activity.fromStatus,
        toStatus: activity.toStatus,
        details: activity.details,
        createdAt: activity.createdAt.toISOString(),
      })),
    },
  });
}

export async function listApplicationInterviews(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (req.userRole !== 'RECRUITER') {
    res.status(403).json({ error: 'Recruiter access required' });
    return;
  }

  const application = await prisma.application.findFirst({
    where: { id: req.params.id, job: { postedByUserId: req.userId } },
    select: { id: true },
  });

  if (!application) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  const interviews = await prisma.interview.findMany({
    where: { applicationId: application.id },
    orderBy: { scheduledAt: 'asc' },
  });

  res.status(200).json({
    interviews: interviews.map((interview) => ({
      ...interview,
      scheduledAt: interview.scheduledAt.toISOString(),
      createdAt: interview.createdAt.toISOString(),
      updatedAt: interview.updatedAt.toISOString(),
    })),
  });
}

export async function createApplicationInterview(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (req.userRole !== 'RECRUITER') {
    res.status(403).json({ error: 'Recruiter access required' });
    return;
  }

  const data = req.body as z.infer<typeof createInterviewSchema>;
  const application = await prisma.application.findFirst({
    where: { id: req.params.id, job: { postedByUserId: req.userId } },
    include: {
      job: { select: JOB_SELECT },
    },
  });

  if (!application) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  if (!RECRUITER_ACTIVE_STATUSES.has(application.status)) {
    res.status(409).json({ error: 'Cannot schedule an interview for this application status' });
    return;
  }

  const scheduledAt = new Date(data.scheduledAt);
  if (scheduledAt.getTime() <= Date.now()) {
    res.status(400).json({ error: 'Interview must be scheduled in the future' });
    return;
  }

  try {
    new Intl.DateTimeFormat('fr-FR', { timeZone: data.timezone }).format(scheduledAt);
  } catch {
    res.status(400).json({ error: 'Invalid timezone' });
    return;
  }

  const interview = await prisma.$transaction(async (tx) => {
    const created = await tx.interview.create({
      data: {
        applicationId: application.id,
        createdByUserId: req.userId!,
        scheduledAt,
        timezone: data.timezone,
        mode: data.mode,
        meetingUrl: data.meetingUrl || null,
        notes: data.notes?.trim() || null,
      },
    });

    await tx.application.update({
      where: { id: application.id },
      data: { status: 'INTERVIEW_SCHEDULED' },
    });

    await tx.applicationActivity.create({
      data: {
        applicationId: application.id,
        actorUserId: req.userId,
        type: 'INTERVIEW_SCHEDULED',
        fromStatus: application.status,
        toStatus: 'INTERVIEW_SCHEDULED',
        details: {
          interviewId: created.id,
          scheduledAt: scheduledAt.toISOString(),
          timezone: data.timezone,
          mode: data.mode,
        },
      },
    });

    return created;
  });

  await notifyInterviewScheduled({
    userId: application.userId,
    jobTitle: application.job.title,
    company: application.job.company,
    scheduledAt,
    timezone: data.timezone,
    mode: data.mode,
    meetingUrl: data.meetingUrl || undefined,
    notes: data.notes,
  });

  res.status(201).json({
    interview: {
      ...interview,
      scheduledAt: interview.scheduledAt.toISOString(),
      createdAt: interview.createdAt.toISOString(),
      updatedAt: interview.updatedAt.toISOString(),
    },
  });
}

/**
 * Vue d'ensemble du pipeline de recrutement pour le tableau de bord
 * recruteur : repartition des candidatures par statut (toutes offres
 * confondues) + candidatures les plus recentes a traiter.
 */
export async function getRecruiterApplicationsOverview(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (req.userRole !== 'RECRUITER') {
    res.status(403).json({ error: 'Recruiter access required' });
    return;
  }

  const jobs = await prisma.job.findMany({
    where: { postedByUserId: req.userId },
    select: { id: true },
  });
  const jobIds = jobs.map((job) => job.id);

  if (jobIds.length === 0) {
    res.status(200).json({ totalApplications: 0, statusCounts: {}, recent: [] });
    return;
  }

  const [statusGroups, recent] = await Promise.all([
    prisma.application.groupBy({
      by: ['status'],
      where: { jobId: { in: jobIds } },
      _count: { _all: true },
    }),
    prisma.application.findMany({
      where: { jobId: { in: jobIds } },
      include: {
        user: { select: { firstName: true, lastName: true } },
        job: { select: { id: true, title: true, company: true } },
      },
      orderBy: [{ updatedAt: 'desc' }],
      take: 8,
    }),
  ]);

  const statusCounts: Record<string, number> = {};
  let totalApplications = 0;
  for (const group of statusGroups) {
    statusCounts[group.status] = group._count._all;
    totalApplications += group._count._all;
  }

  res.status(200).json({
    totalApplications,
    statusCounts,
    recent: recent.map((application) => ({
      id: application.id,
      status: application.status,
      updatedAt: application.updatedAt.toISOString(),
      candidateName: `${application.user.firstName} ${application.user.lastName}`,
      jobId: application.job.id,
      jobTitle: application.job.title,
      company: application.job.company,
    })),
  });
}

export async function createApplication(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (req.userRole !== 'CANDIDATE') {
    res.status(403).json({ error: 'Candidate access required' });
    return;
  }

  const data = req.body as z.infer<typeof applicationSchema>;

  const job = await prisma.job.findUnique({ where: { id: data.jobId } });
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  if (job.status !== 'PUBLISHED') {
    res.status(409).json({ error: 'This job is not accepting applications' });
    return;
  }

  const existing = await prisma.application.findFirst({
    where: {
      userId: req.userId,
      jobId: data.jobId,
    },
  });

  if (existing) {
    res.status(409).json({ error: 'An application already exists for this job' });
    return;
  }

  if (data.resumeId) {
    const resume = await prisma.resume.findFirst({
      where: { id: data.resumeId, userId: req.userId },
    });

    if (!resume) {
      res.status(404).json({ error: 'Resume not found' });
      return;
    }
  }

  const application = await prisma.application.create({
    data: {
      userId: req.userId!,
      jobId: data.jobId,
      resumeId: data.resumeId ?? null,
      coverLetterId: data.coverLetterId ?? null,
      status: data.status,
      submittedAt: data.status === 'SUBMITTED' ? new Date() : null,
      compatibilityScore: data.compatibilityScore ?? null,
    },
    include: {
      job: { select: JOB_SELECT },
    },
  });

  // Notifie le candidat + le recruteur quand la candidature est directement soumise
  if (data.status === 'SUBMITTED') {
    const candidate = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { firstName: true, lastName: true },
    });

    await notifyNewApplication({
      candidateUserId: req.userId!,
      candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Un candidat',
      jobTitle: job.title,
      company: job.company,
      jobId: job.id,
      recruiterUserId: job.postedByUserId ?? null,
    });
  }

  res.status(201).json({ application: toApplicationResponse(application) });
}

/**
 * Met a jour le statut d'une candidature.
 * - Le candidat peut modifier le statut de ses propres candidatures.
 * - Le recruteur peut modifier le statut des candidatures recues sur ses
 *   offres (gestion du pipeline / Kanban) et personnaliser le message
 *   envoye au candidat.
 */
export async function updateApplicationStatus(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const data = req.body as z.infer<typeof updateApplicationStatusSchema>;

  const existing = await prisma.application.findFirst({
    where: { id },
    include: {
      job: { select: JOB_SELECT },
    },
  });

  if (!existing) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  const isOwningCandidate = req.userRole === 'CANDIDATE' && existing.userId === req.userId;
  const isOwningRecruiter =
    req.userRole === 'RECRUITER' && existing.job.postedByUserId === req.userId;

  const isCandidateWithdrawal =
    isOwningCandidate && data.status === 'REJECTED' && CANDIDATE_WITHDRAWABLE_FROM.has(existing.status);

  if (isOwningCandidate && !CANDIDATE_ALLOWED_STATUSES.has(data.status) && !isCandidateWithdrawal) {
    res.status(403).json({ error: 'Candidate cannot set this application status' });
    return;
  }

  if (!isOwningCandidate && !isOwningRecruiter) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  if (isOwningRecruiter) {
    if (RECRUITER_TECHNICAL_STATUSES.has(data.status)) {
      res.status(403).json({ error: 'Recruiters cannot set technical application statuses' });
      return;
    }

    if (!isAllowedRecruiterStatusTransition(existing.status, data.status)) {
      res.status(409).json({
        error: `Invalid recruiter status transition from ${existing.status} to ${data.status}`,
      });
      return;
    }
  }

  const statusChanged = data.status !== existing.status;

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.application.update({
      where: { id },
      data: {
        status: data.status,
        submittedAt: data.status === 'SUBMITTED' ? new Date() : existing.submittedAt,
      },
      include: {
        job: { select: JOB_SELECT },
      },
    });

    if (statusChanged) {
      await tx.applicationActivity.create({
        data: {
          applicationId: existing.id,
          actorUserId: req.userId,
          type: 'STATUS_CHANGED',
          fromStatus: existing.status,
          toStatus: next.status,
          details: data.message ? { message: data.message } : undefined,
        },
      });
    }

    return next;
  });

  // Le candidat n'a pas besoin d'etre notifie de ses propres actions ; on
  // notifie uniquement lorsque c'est le recruteur qui fait evoluer le statut.
  if (isOwningRecruiter && statusChanged) {
    await notifyApplicationStatusChange({
      userId: updated.userId,
      jobTitle: existing.job.title,
      company: existing.job.company,
      status: updated.status,
      message: data.message,
    });
  }

  // A l'inverse, quand c'est le candidat qui soumet ou retire sa
  // candidature, on notifie le recruteur proprietaire de l'offre.
  if (isOwningCandidate && statusChanged && (data.status === 'SUBMITTED' || isCandidateWithdrawal)) {
    const candidate = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { firstName: true, lastName: true },
    });

    await notifyRecruiterApplicationEvent({
      recruiterUserId: existing.job.postedByUserId,
      candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Un candidat',
      jobTitle: existing.job.title,
      company: existing.job.company,
      jobId: existing.job.id,
      event: data.status === 'SUBMITTED' ? 'SUBMITTED' : 'WITHDRAWN',
    });
  }

  res.status(200).json({ application: toApplicationResponse(updated) });
}

/**
 * Ajoute / met a jour la note interne du recruteur sur une candidature.
 * Cette note n'est jamais retournee au candidat.
 */
export async function updateRecruiterNote(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (req.userRole !== 'RECRUITER') {
    res.status(403).json({ error: 'Recruiter access required' });
    return;
  }

  const { id } = req.params;
  const data = req.body as z.infer<typeof updateApplicationRecruiterNoteSchema>;

  const existing = await prisma.application.findFirst({
    where: { id },
    include: { job: { select: { postedByUserId: true } } },
  });

  if (!existing || existing.job.postedByUserId !== req.userId) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  const updated = await prisma.application.update({
    where: { id },
    data: { recruiterNotes: data.recruiterNotes },
  });

  await prisma.applicationActivity.create({
    data: {
      applicationId: existing.id,
      actorUserId: req.userId,
      type: 'RECRUITER_NOTE_UPDATED',
      details: { recruiterNotes: updated.recruiterNotes },
    },
  });

  res.status(200).json({
    applicationId: updated.id,
    recruiterNotes: updated.recruiterNotes,
  });
}

/**
 * Valide definitivement une candidature (statut ACCEPTED) et joint une
 * promesse d'embauche / un message de confirmation envoye au candidat.
 */
export async function acceptApplication(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (req.userRole !== 'RECRUITER') {
    res.status(403).json({ error: 'Recruiter access required' });
    return;
  }

  const { id } = req.params;
  const data = req.body as z.infer<typeof acceptApplicationSchema>;

  const existing = await prisma.application.findFirst({
    where: { id },
    include: { job: { select: JOB_SELECT } },
  });

  if (!existing || existing.job.postedByUserId !== req.userId) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }

  if (!RECRUITER_ACTIVE_STATUSES.has(existing.status)) {
    res.status(409).json({ error: 'Cannot accept an application from its current status' });
    return;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.application.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        hiringMessage: data.hiringMessage,
      },
      include: {
        job: { select: JOB_SELECT },
      },
    });

    await tx.applicationActivity.create({
      data: {
        applicationId: existing.id,
        actorUserId: req.userId,
        type: 'STATUS_CHANGED',
        fromStatus: existing.status,
        toStatus: 'ACCEPTED',
        details: { message: data.hiringMessage },
      },
    });

    return next;
  });

  await notifyApplicationStatusChange({
    userId: updated.userId,
    jobTitle: existing.job.title,
    company: existing.job.company,
    status: 'ACCEPTED',
    message: data.hiringMessage,
  });

  res.status(200).json({ application: toApplicationResponse(updated) });
}
