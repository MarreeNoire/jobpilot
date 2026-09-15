/**
 * Calcul du score de compatibilité entre le profil d'un candidat et une offre.
 * Score de 0 à 100, sans IA externe — basé sur du matching de mots-clés pondérés.
 *
 * Pondération :
 *  - Titre du poste     → 40 pts
 *  - Localisation       → 30 pts
 *  - Type de contrat    → 20 pts
 *  - Description / mots-clés → 10 pts
 */

export interface CandidatePreferences {
  jobTitles: string[];
  locations: string[];
  remote: boolean;
  contractTypes: string[];
}

export interface JobForMatching {
  title: string;
  company: string;
  location: string | null;
  description: string | null;
}

function normalize(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function anyMatch(needles: string[], haystack: string): boolean {
  const h = normalize(haystack);
  return needles.some((n) => h.includes(normalize(n)));
}

export function computeMatchScore(
  job: JobForMatching,
  prefs: CandidatePreferences | null,
  candidateSkills: string[] = []
): number {
  if (!prefs) return 0;

  let score = 0;

  // ─── Titre du poste (40 pts) ───────────────────────────────────────────────
  if (prefs.jobTitles.length > 0) {
    const titleHaystack = `${job.title} ${job.company}`;
    if (anyMatch(prefs.jobTitles, titleHaystack)) {
      score += 40;
    } else {
      // Correspondance partielle : chaque mot d'un titre recherché présent
      const words = prefs.jobTitles.flatMap((t) => normalize(t).split(/\s+/));
      const uniqueWords = [...new Set(words)];
      const matched = uniqueWords.filter((w) => normalize(titleHaystack).includes(w));
      score += Math.min(30, Math.round((matched.length / Math.max(uniqueWords.length, 1)) * 30));
    }
  }

  // ─── Localisation (30 pts) ────────────────────────────────────────────────
  if (prefs.remote) {
    const desc = normalize(job.description ?? '');
    if (desc.includes('remote') || desc.includes('télétravail') || desc.includes('teletravail')) {
      score += 30;
    }
  }

  if (prefs.locations.length > 0 && job.location) {
    if (anyMatch(prefs.locations, job.location)) {
      score += 30;
    } else {
      score += 10; // présence d'une localisation même non correspondante vaut un peu
    }
  } else if (prefs.locations.length === 0) {
    score += 15; // pas de préférence = neutre
  }

  // ─── Type de contrat (20 pts) ─────────────────────────────────────────────
  if (prefs.contractTypes.length > 0 && job.description) {
    const contractMap: Record<string, string[]> = {
      'CDI': ['cdi', 'emploi', 'permanent'],
      'CDD': ['cdd', 'contrat à durée déterminée'],
      'Stage': ['stage', 'stagiaire', 'internship'],
      'Freelance': ['freelance', 'consultant', 'consultance'],
      'Interim': ['intérim', 'interim', 'temporaire'],
    };

    const desc = normalize(job.description);
    const matched = prefs.contractTypes.some((ct) => {
      const synonyms = contractMap[ct] ?? [normalize(ct)];
      return synonyms.some((s) => desc.includes(s));
    });

    if (matched) score += 20;
  } else if (prefs.contractTypes.length === 0) {
    score += 10;
  }

  // ─── Compétences / mots-clés dans la description (10 pts) ───────────────
  if (candidateSkills.length > 0 && job.description) {
    const desc = normalize(job.description);
    const matched = candidateSkills.filter((skill) => desc.includes(normalize(skill)));
    if (matched.length > 0) {
      score += Math.min(10, Math.round((matched.length / Math.min(candidateSkills.length, 5)) * 10));
    }
  }

  return Math.min(100, Math.max(0, score));
}

export function getScoreColor(score: number): string {
  if (score >= 75) return 'bg-emerald-100 text-emerald-700';
  if (score >= 50) return 'bg-blue-100 text-blue-700';
  if (score >= 25) return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

export function getScoreLabel(score: number): string {
  if (score >= 75) return 'Très bon match';
  if (score >= 50) return 'Bon match';
  if (score >= 25) return 'Correspondance partielle';
  return 'Peu de correspondance';
}
