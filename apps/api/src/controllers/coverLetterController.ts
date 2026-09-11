import { Response } from 'express';
import { prisma } from '../../../../packages/database/src/index';
import type { Prisma } from '@prisma/client';
import { coverLetterSchema } from '../../../../packages/validation/src/userValidation';
import type { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth';

type CoverLetterData = z.infer<typeof coverLetterSchema>;

export async function listCoverLetters(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const coverLetters = await prisma.coverLetter.findMany({
    where: { userId: req.userId },
    orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
  });

  res.status(200).json({ coverLetters });
}

export async function createCoverLetter(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const data = req.body as CoverLetterData;

  const coverLetter = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (data.isPrimary) {
      await tx.coverLetter.updateMany({
        where: { userId: req.userId },
        data: { isPrimary: false },
      });
    }

    return tx.coverLetter.create({
      data: {
        userId: req.userId!,
        title: data.title,
        content: data.content,
        isPrimary: data.isPrimary,
      },
    });
  });

  res.status(201).json({ coverLetter });
}

export async function updateCoverLetter(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const data = req.body as CoverLetterData;

  const existing = await prisma.coverLetter.findFirst({
    where: { id, userId: req.userId },
  });

  if (!existing) {
    res.status(404).json({ error: 'Cover letter not found' });
    return;
  }

  const coverLetter = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (data.isPrimary) {
      await tx.coverLetter.updateMany({
        where: { userId: req.userId },
        data: { isPrimary: false },
      });
    }

    return tx.coverLetter.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        isPrimary: data.isPrimary,
      },
    });
  });

  res.status(200).json({ coverLetter });
}

export async function deleteCoverLetter(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;

  const existing = await prisma.coverLetter.findFirst({
    where: { id, userId: req.userId },
  });

  if (!existing) {
    res.status(404).json({ error: 'Cover letter not found' });
    return;
  }

  await prisma.coverLetter.delete({ where: { id } });
  res.status(200).json({ message: 'Cover letter deleted' });
}
