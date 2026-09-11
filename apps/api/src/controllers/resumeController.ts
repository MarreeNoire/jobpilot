import { Response } from 'express';
import { prisma } from '../../../../packages/database/src/index';
import type { Prisma } from '@prisma/client';
import { resumeSchema } from '../../../../packages/validation/src/userValidation';
import type { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth';
import { deleteStoredResumeFile } from '../services/resumeStorage';

function toResumeResponse(resume: {
  id: string;
  userId: string;
  title: string;
  fileUrl?: string | null;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: resume.id,
    userId: resume.userId,
    title: resume.title,
    fileUrl: resume.fileUrl || null,
    hasUploadedFile: false,
    isPrimary: resume.isPrimary,
    createdAt: resume.createdAt.toISOString(),
    updatedAt: resume.updatedAt.toISOString(),
  };
}

export async function listResumes(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const resumes = await prisma.resume.findMany({
    where: { userId: req.userId },
    orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
  });

  res.status(200).json({ resumes: resumes.map(toResumeResponse) });
}

export async function createResume(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const data = req.body as z.infer<typeof resumeSchema>;

  const resume = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (data.isPrimary) {
      await tx.resume.updateMany({
        where: { userId: req.userId },
        data: { isPrimary: false },
      });
    }

    return tx.resume.create({
      data: {
        userId: req.userId!,
        title: data.title,
        fileUrl: data.fileUrl ?? '',
        isPrimary: data.isPrimary,
      },
    });
  });

  res.status(201).json({ resume: toResumeResponse(resume) });
}

export async function deleteResume(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;

  const existing = await prisma.resume.findFirst({
    where: { id, userId: req.userId },
  });

  if (!existing) {
    res.status(404).json({ error: 'Resume not found' });
    return;
  }

  await deleteStoredResumeFile(existing.fileUrl);
  await prisma.resume.delete({ where: { id } });
  res.status(200).json({ message: 'Resume deleted' });
}

export async function setPrimaryResume(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;

  const existing = await prisma.resume.findFirst({
    where: { id, userId: req.userId },
  });

  if (!existing) {
    res.status(404).json({ error: 'Resume not found' });
    return;
  }

  await prisma.$transaction([
    prisma.resume.updateMany({
      where: { userId: req.userId },
      data: { isPrimary: false },
    }),
    prisma.resume.update({
      where: { id },
      data: { isPrimary: true },
    }),
  ]);

  const updated = await prisma.resume.findUnique({ where: { id } });
  res.status(200).json({ resume: toResumeResponse(updated!) });
}
