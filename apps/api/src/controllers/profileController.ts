import { Response } from 'express';
import { prisma } from '../../../../packages/database/src/index';
import { profileSchema } from '../../../../packages/validation/src/userValidation';
import type { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth';

function toProfileResponse(profile: {
  id: string;
  userId: string;
  title: string | null;
  professionalSummary: string | null;
  yearsOfExperience: number | null;
  availability: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...profile,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export async function getProfile(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const profile = await prisma.profile.findUnique({
    where: { userId: req.userId },
  });

  if (!profile) {
    res.status(200).json({ profile: null });
    return;
  }

  res.status(200).json({ profile: toProfileResponse(profile) });
}

export async function upsertProfile(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const data = req.body as z.infer<typeof profileSchema>;

  const profile = await prisma.profile.upsert({
    where: { userId: req.userId },
    update: {
      title: data.title ?? null,
      professionalSummary: data.professionalSummary ?? null,
      yearsOfExperience: data.yearsOfExperience ?? null,
      availability: data.availability ?? null,
    },
    create: {
      userId: req.userId!,
      title: data.title ?? null,
      professionalSummary: data.professionalSummary ?? null,
      yearsOfExperience: data.yearsOfExperience ?? null,
      availability: data.availability ?? null,
    },
  });

  res.status(200).json({ profile: toProfileResponse(profile) });
}
