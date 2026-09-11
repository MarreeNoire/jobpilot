import { Response } from 'express';
import { prisma } from '../../../../packages/database/src/index';
import type { AuthenticatedRequest } from '../middleware/auth';

interface AutomationRuleBody {
  name: string;
  keywords: string[];
  locations: string[];
  contractTypes: string[];
  minScore: number | null;
  resumeId: string | null;
  coverLetterId: string | null;
  autoApply: boolean;
}

function parseBody(raw: Record<string, unknown>): AutomationRuleBody {
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const keywords = Array.isArray(raw.keywords)
    ? (raw.keywords as unknown[]).filter((k): k is string => typeof k === 'string')
    : [];
  const locations = Array.isArray(raw.locations)
    ? (raw.locations as unknown[]).filter((l): l is string => typeof l === 'string')
    : [];
  const contractTypes = Array.isArray(raw.contractTypes)
    ? (raw.contractTypes as unknown[]).filter((c): c is string => typeof c === 'string')
    : [];
  const minScore =
    typeof raw.minScore === 'number' && raw.minScore >= 0 && raw.minScore <= 100
      ? raw.minScore
      : null;
  const resumeId = typeof raw.resumeId === 'string' && raw.resumeId ? raw.resumeId : null;
  const coverLetterId =
    typeof raw.coverLetterId === 'string' && raw.coverLetterId ? raw.coverLetterId : null;
  const autoApply = raw.autoApply === true;

  return { name, keywords, locations, contractTypes, minScore, resumeId, coverLetterId, autoApply };
}

export async function listAutomationRules(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const rules = await prisma.automationRule.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({ rules });
}

export async function createAutomationRule(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const data = parseBody(req.body as Record<string, unknown>);

  if (!data.name) {
    res.status(400).json({ error: 'Validation failed', details: [{ path: 'name', message: 'Name is required' }] });
    return;
  }

  const rule = await prisma.automationRule.create({
    data: {
      userId: req.userId!,
      name: data.name,
      keywords: data.keywords,
      locations: data.locations,
      contractTypes: data.contractTypes,
      minScore: data.minScore,
      resumeId: data.resumeId,
      coverLetterId: data.coverLetterId,
      autoApply: data.autoApply,
    },
  });

  res.status(201).json({ rule });
}

export async function updateAutomationRule(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const raw = req.body as Record<string, unknown>;

  const existing = await prisma.automationRule.findFirst({
    where: { id, userId: req.userId },
  });

  if (!existing) {
    res.status(404).json({ error: 'Automation rule not found' });
    return;
  }

  const data = parseBody({
    ...existing,
    ...raw,
  });

  const rule = await prisma.automationRule.update({
    where: { id },
    data: {
      name: data.name,
      keywords: data.keywords,
      locations: data.locations,
      contractTypes: data.contractTypes,
      minScore: data.minScore,
      resumeId: data.resumeId,
      coverLetterId: data.coverLetterId,
      autoApply: data.autoApply,
    },
  });

  res.status(200).json({ rule });
}

export async function deleteAutomationRule(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;

  const existing = await prisma.automationRule.findFirst({
    where: { id, userId: req.userId },
  });

  if (!existing) {
    res.status(404).json({ error: 'Automation rule not found' });
    return;
  }

  await prisma.automationRule.delete({ where: { id } });
  res.status(200).json({ message: 'Automation rule deleted' });
}
