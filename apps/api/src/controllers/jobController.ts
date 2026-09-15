import { Response } from 'express';
import { prisma } from '../../../../packages/database/src/index';
import { jobSchema, updateJobStatusSchema } from '../../../../packages/validation/src/userValidation';
import type { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth';
import { syncEducarriereJobsSafely } from '../services/jobSyncService';

function toJobResponse(job: {
  id: string;
  platform: string;
  platformId: string;
  title: string;
  company: string;
  description: string | null;
  location: string | null;
  salary: string | null;
  contactEmail?: string | null;
  url: string;
  postedAt: Date | null;
  retrievedAt: Date;
  status: string;
}) {
  return {
    ...job,
    contactEmail: job.contactEmail ?? null,
    postedAt: job.postedAt?.toISOString() ?? null,
    retrievedAt: job.retrievedAt.toISOString(),
  };
}

export async function listJobs(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (req.userRole !== 'CANDIDATE') {
    res.status(403).json({ error: 'Candidate access required' });
    return;
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const where = { status: 'PUBLISHED' as const };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      orderBy: [{ retrievedAt: 'desc' }],
      where,
      skip,
      take: limit,
    }),
    prisma.job.count({ where }),
  ]);

  res.status(200).json({
    jobs: jobs.map(toJobResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}

export async function createJob(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (req.userRole !== 'RECRUITER') {
    res.status(403).json({ error: 'Recruiter access required' });
    return;
  }

  const data = req.body as z.infer<typeof jobSchema>;

  const existingJob = await prisma.job.findUnique({
    where: { url: data.url },
  });

  if (existingJob) {
    res.status(409).json({ error: 'A job with this URL already exists' });
    return;
  }

  const job = await prisma.job.create({
    data: {
      platform: data.platform,
      platformId: data.platformId,
      title: data.title,
      company: data.company,
      description: data.description ?? null,
      location: data.location ?? null,
      salary: data.salary ?? null,
      contactEmail: data.contactEmail || null,
      url: data.url,
      postedByUserId: req.userId,
      status: 'PUBLISHED',
    },
  });

  res.status(201).json({ job: toJobResponse(job) });
}

export async function listMyJobs(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (req.userRole !== 'RECRUITER') {
    res.status(403).json({ error: 'Recruiter access required' });
    return;
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const where = { postedByUserId: req.userId };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: [{ retrievedAt: 'desc' }],
      include: {
        _count: { select: { applications: true } },
      },
      skip,
      take: limit,
    }),
    prisma.job.count({ where }),
  ]);

  res.status(200).json({
    jobs: jobs.map((job) => ({
      ...toJobResponse(job),
      applicationsCount: job._count.applications,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}

const JOB_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  DRAFT: ['PUBLISHED'],
  PUBLISHED: ['PAUSED', 'CLOSED'],
  PAUSED: ['PUBLISHED', 'CLOSED'],
  CLOSED: [],
};

export async function updateJobStatus(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (req.userRole !== 'RECRUITER') {
    res.status(403).json({ error: 'Recruiter access required' });
    return;
  }

  const data = req.body as z.infer<typeof updateJobStatusSchema>;
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });

  // Imported candidate jobs have no owner and must never be changed by a recruiter.
  if (!job || job.postedByUserId !== req.userId) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  if (job.status === data.status) {
    res.status(200).json({ job: toJobResponse(job) });
    return;
  }

  if (!JOB_STATUS_TRANSITIONS[job.status]?.includes(data.status)) {
    res.status(409).json({
      error: `Invalid job status transition from ${job.status} to ${data.status}`,
    });
    return;
  }

  const updated = await prisma.job.update({
    where: { id: job.id },
    data: { status: data.status },
  });

  res.status(200).json({ job: toJobResponse(updated) });
}

export async function syncEducarriereJobsManually(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (req.userRole !== 'RECRUITER') {
    res.status(403).json({ error: 'Recruiter access required' });
    return;
  }

  const syncResult = await syncEducarriereJobsSafely();

  if (!syncResult.started) {
    res.status(409).json({ error: syncResult.reason });
    return;
  }

  res.status(200).json({
    message: 'Educarriere sync completed',
    ...syncResult.result,
  });
}

export async function getJobById(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;

  if (req.userRole !== 'CANDIDATE') {
    res.status(403).json({ error: 'Candidate access required' });
    return;
  }

  const job = await prisma.job.findFirst({ where: { id, status: 'PUBLISHED' } });

  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  res.status(200).json({ job: toJobResponse(job) });
}
