import { prisma } from '../../../../packages/database/src/index';
import { notifyAutoApplicationBatch, notifyNewApplication } from './notificationService';

/** Nombre max de candidatures automatiques par règle et par sync (garde-fou). */
const MAX_AUTO_APPLY_PER_RULE = 5;

// ──────────────────────────────────────────────────────────────────────────────
// Utilitaires de correspondance (même logique que le matching côté web)
// ──────────────────────────────────────────────────────────────────────────────

function n(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function matchesKeywords(title: string, description: string | null, keywords: string[]): boolean {
  if (keywords.length === 0) return true;
  const haystack = n(`${title} ${description ?? ''}`);
  return keywords.some((kw) => haystack.includes(n(kw)));
}

function matchesLocation(location: string | null, locations: string[]): boolean {
  if (locations.length === 0) return true;
  if (!location) return false;
  const loc = n(location);
  return locations.some((l) => loc.includes(n(l)));
}

function matchesContractType(description: string | null, contractTypes: string[]): boolean {
  if (contractTypes.length === 0) return true;
  if (!description) return false;

  const desc = n(description);
  const synonyms: Record<string, string[]> = {
    CDI: ['cdi', 'emploi permanent'],
    CDD: ['cdd', 'contrat a duree determinee'],
    Stage: ['stage', 'stagiaire'],
    Freelance: ['freelance', 'consultant', 'consultance'],
    Interim: ['interim', 'interimaire', 'interim'],
  };

  return contractTypes.some((ct) => {
    const syns = synonyms[ct] ?? [n(ct)];
    return syns.some((s) => desc.includes(s));
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Moteur principal d'automatisation
// ──────────────────────────────────────────────────────────────────────────────

interface AutoApplied {
  userId: string;
  jobTitle: string;
  company: string;
  jobId: string;
  recruiterUserId: string | null;
}

/**
 * Évalue toutes les règles d'automatisation actives contre les offres
 * nouvellement créées et soumet les candidatures correspondantes.
 *
 * Appelé automatiquement après chaque synchronisation d'offres.
 */
export async function runAutomationRulesForJobs(newJobIds: string[]): Promise<void> {
  if (newJobIds.length === 0) {
    console.log('[automation] Aucune nouvelle offre — rien à traiter.');
    return;
  }

  console.log(`[automation] Évaluation de ${newJobIds.length} nouvelle(s) offre(s)…`);

  const rules = await prisma.automationRule.findMany({
    where: { autoApply: true },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (rules.length === 0) {
    console.log('[automation] Aucune règle auto-candidature active.');
    return;
  }

  console.log(`[automation] ${rules.length} règle(s) active(s) à vérifier.`);

  const jobs = await prisma.job.findMany({
    where: { id: { in: newJobIds }, status: 'PUBLISHED' },
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      description: true,
      postedByUserId: true,
      analyses: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { compatibilityScore: true },
      },
    },
  });

  // Résultats groupés par candidat pour la notification batch
  const autoAppliedByUser = new Map<string, AutoApplied[]>();

  for (const rule of rules) {
    const { userId } = rule;
    let appliedCount = 0;

    for (const job of jobs) {
      if (appliedCount >= MAX_AUTO_APPLY_PER_RULE) break;

      // Vérification des critères de la règle
      if (!matchesKeywords(job.title, job.description, rule.keywords)) continue;
      if (!matchesLocation(job.location, rule.locations)) continue;
      if (!matchesContractType(job.description, rule.contractTypes)) continue;
      const compatibilityScore = job.analyses[0]?.compatibilityScore ?? null;
      if (rule.minScore !== null &&
          (compatibilityScore === null || compatibilityScore < rule.minScore)) {
        continue;
      }

      // Pas de doublon
      const existing = await prisma.application.findFirst({
        where: { userId, jobId: job.id },
        select: { id: true },
      });
      if (existing) continue;

      const automationLog = await prisma.automationLog.create({
        data: {
          automationRuleId: rule.id,
          status: 'STARTED',
          details: { jobId: job.id },
        },
      });

      // Création de la candidature automatique
      try {
        const application = await prisma.application.create({
          data: {
            userId,
            jobId: job.id,
            resumeId: rule.resumeId ?? null,
            coverLetterId: rule.coverLetterId ?? null,
            status: 'SUBMITTED',
            compatibilityScore,
            submittedAt: new Date(),
          },
        });
        await prisma.automationLog.update({
          where: { id: automationLog.id },
          data: {
            applicationId: application.id,
            status: 'APPLIED',
            details: { jobId: job.id, compatibilityScore },
          },
        });

        if (!autoAppliedByUser.has(userId)) {
          autoAppliedByUser.set(userId, []);
        }
        autoAppliedByUser.get(userId)!.push({
          userId,
          jobTitle: job.title,
          company: job.company,
          jobId: job.id,
          recruiterUserId: job.postedByUserId ?? null,
        });

        appliedCount++;
        console.log(
          `[automation] ✅ Candidature auto : user=${userId} job="${job.title}" règle="${rule.name}"`
        );
      } catch (err) {
        await prisma.automationLog.update({
          where: { id: automationLog.id },
          data: {
            status: 'FAILED',
            details: {
              jobId: job.id,
              error: err instanceof Error ? err.message : 'Unknown error',
            },
          },
        });
        console.error(`[automation] ❌ Échec : user=${userId} job=${job.id}`, err);
      }
    }
  }

  // Envoi des notifications groupées par candidat
  for (const [userId, applied] of autoAppliedByUser.entries()) {
    // Email récap au candidat (1 seul email pour N offres)
    try {
      await notifyAutoApplicationBatch(
        userId,
        applied.map((a) => ({ jobTitle: a.jobTitle, company: a.company, jobId: a.jobId }))
      );
    } catch (err) {
      console.error(`[automation] Erreur notification candidat user=${userId}`, err);
    }

    // Notification individuelle aux recruteurs de la plateforme
    for (const a of applied) {
      if (!a.recruiterUserId) continue;
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { firstName: true, lastName: true },
        });
        await notifyNewApplication({
          candidateUserId: userId,
          candidateName: user ? `${user.firstName} ${user.lastName}` : 'Un candidat',
          jobTitle: a.jobTitle,
          company: a.company,
          jobId: a.jobId,
          recruiterUserId: a.recruiterUserId,
        });
      } catch {
        // Erreur non bloquante
      }
    }
  }

  const total = [...autoAppliedByUser.values()].reduce((sum, arr) => sum + arr.length, 0);
  console.log(`[automation] Terminé — ${total} candidature(s) automatique(s) soumise(s).`);
}
