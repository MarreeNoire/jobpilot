/** Sous-ensemble des statuts pertinents pour le pipeline de recrutement (Kanban). */
export const recruiterPipelineStatuses = [
  'PENDING',
  'REVIEWING',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'ACCEPTED',
  'REJECTED',
] as const;

export type RecruiterPipelineStatus = (typeof recruiterPipelineStatuses)[number];
