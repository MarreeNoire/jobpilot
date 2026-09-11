import { syncEducarriereJobs } from './educarriereScraper';
import { runAutomationRulesForJobs } from './automationService';

let educarriereSyncInProgress = false;

export async function syncEducarriereJobsSafely() {
  if (educarriereSyncInProgress) {
    return {
      started: false,
      reason: 'A sync is already in progress',
    } as const;
  }

  educarriereSyncInProgress = true;

  try {
    const result = await syncEducarriereJobs();

    // Déclenche les règles d'automatisation sur les nouvelles offres
    if (result.createdJobIds.length > 0) {
      console.log(`[sync] ${result.createdJobIds.length} nouvelle(s) offre(s) — évaluation des règles d'automatisation…`);
      await runAutomationRulesForJobs(result.createdJobIds).catch((err) => {
        console.error('[sync] Erreur automation (non bloquante) :', err);
      });
    }

    return {
      started: true,
      result,
    } as const;
  } finally {
    educarriereSyncInProgress = false;
  }
}

export async function syncAllJobSources() {
  return {
    educarriere: await syncEducarriereJobsSafely(),
  };
}
