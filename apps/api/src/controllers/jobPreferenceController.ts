import { Response } from 'express';
import { prisma } from '../../../../packages/database/src/index';
import { jobPreferenceSchema } from '../../../../packages/validation/src/userValidation';
import type { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth';

function toJobPreferenceResponse(preference: {
  id: string;
  userId: string;
  jobTitles: string[];
  locations: string[];
  remote: boolean;
  minSalary: number | null;
  contractTypes: string[];
  industries: string[];
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...preference,
    createdAt: preference.createdAt.toISOString(),
    updatedAt: preference.updatedAt.toISOString(),
  };
}

export async function getJobPreference(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const preference = await prisma.jobPreference.findUnique({
    where: { userId: req.userId },
  });

  if (!preference) {
    res.status(200).json({ preference: null });
    return;
  }

  res.status(200).json({ preference: toJobPreferenceResponse(preference) });
}

export async function upsertJobPreference(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const data = req.body as z.infer<typeof jobPreferenceSchema>;

  const preference = await prisma.jobPreference.upsert({
    where: { userId: req.userId },
    update: {
      jobTitles: data.jobTitles,
      locations: data.locations,
      remote: data.remote,
      minSalary: data.minSalary ?? null,
      contractTypes: data.contractTypes,
      industries: data.industries,
    },
    create: {
      userId: req.userId!,
      jobTitles: data.jobTitles,
      locations: data.locations,
      remote: data.remote,
      minSalary: data.minSalary ?? null,
      contractTypes: data.contractTypes,
      industries: data.industries,
    },
  });

  res.status(200).json({ preference: toJobPreferenceResponse(preference) });
}
