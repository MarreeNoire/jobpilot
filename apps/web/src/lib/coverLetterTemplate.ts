/**
 * Générateur de lettre de motivation basé sur des templates intelligents.
 * Utilise les données réelles du profil candidat + l'offre ciblée.
 * Aucune IA externe requise — 100% gratuit.
 * Quand un budget OpenAI est disponible, remplacer cette fonction par un appel GPT-4o.
 */

export interface TemplateParams {
  // Candidat
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  // Profil
  profileTitle?: string | null;
  professionalSummary?: string | null;
  yearsOfExperience?: number | null;
  // Compétences (top 5)
  skills: string[];
  // Expérience la plus récente
  latestExperience?: {
    company: string;
    position: string;
    description?: string | null;
  } | null;
  // Offre ciblée
  jobTitle: string;
  company: string;
  location?: string | null;
}

export function generateCoverLetter(p: TemplateParams): string {
  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const topSkills = p.skills.slice(0, 5);
  const skillsStr =
    topSkills.length > 1
      ? `${topSkills.slice(0, -1).join(', ')} et ${topSkills.at(-1)}`
      : topSkills[0] ?? 'mes compétences';

  const expLine = p.latestExperience
    ? `Mon expérience en tant que ${p.latestExperience.position} chez ${p.latestExperience.company} m'a permis de développer une solide expertise et de contribuer concrètement à des résultats mesurables.`
    : '';

  const experienceLine =
    p.yearsOfExperience && p.yearsOfExperience > 0
      ? `Fort(e) de ${p.yearsOfExperience} année${p.yearsOfExperience > 1 ? 's' : ''} d'expérience${p.profileTitle ? ` en tant que ${p.profileTitle}` : ''}, je`
      : `Passionné(e) par mon domaine${p.profileTitle ? ` et fort(e) de mon profil de ${p.profileTitle}` : ''}, je`;

  const summaryLine = p.professionalSummary
    ? `\n${p.professionalSummary.split('.')[0]}.`
    : '';

  const locationLine = p.location ? ` basée à ${p.location}` : '';

  return `${today}

Madame, Monsieur,

C'est avec un vif intérêt que je vous adresse ma candidature pour le poste de **${p.jobTitle}** au sein de votre entreprise **${p.company}**${locationLine}.${summaryLine}

${experienceLine} maîtrise les domaines clés de ce poste, notamment ${skillsStr}. ${expLine}

Ma candidature est motivée par la volonté de rejoindre une structure dynamique où je pourrai mettre à profit mes compétences tout en continuant à progresser. Je suis convaincu(e) que mon profil correspond aux attentes de votre équipe et que je saurai m'intégrer rapidement pour apporter une contribution significative.

Je reste disponible pour un entretien à votre convenance et vous adresse, Madame, Monsieur, mes cordiales salutations.

${p.firstName} ${p.lastName}
${p.email}${p.phone ? `\n${p.phone}` : ''}`;
}
