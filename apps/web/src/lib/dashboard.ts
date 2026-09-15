import { API_BASE_URL, parseApiError } from './api';

export interface DashboardProfile {
  title?: string | null;
  professionalSummary?: string | null;
  yearsOfExperience?: number | null;
}

export interface DashboardPreference {
  jobTitles?: string[];
  locations?: string[];
}

export interface DashboardResume {
  isPrimary?: boolean;
}

export interface DashboardJob {
  id: string;
  title: string;
  company: string;
  platform: string;
  url: string;
  location?: string | null;
}

export type RecruiterJobStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'CLOSED';

export interface RecruiterJob {
  id: string;
  title: string;
  company: string;
  location?: string | null;
  retrievedAt: string;
  status: RecruiterJobStatus;
  applicationsCount: number;
}

export type PipelineStatus =
  | 'PENDING'
  | 'REVIEWING'
  | 'SHORTLISTED'
  | 'INTERVIEW_SCHEDULED'
  | 'ACCEPTED'
  | 'REJECTED';

export interface RecruiterRecentApplication {
  id: string;
  status: PipelineStatus;
  updatedAt: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  company: string;
}

export interface RecruiterApplicationsOverview {
  totalApplications: number;
  statusCounts: Partial<Record<PipelineStatus, number>>;
  recent: RecruiterRecentApplication[];
  error?: string;
}

export interface RecruiterJobsResult {
  jobs: RecruiterJob[];
  error?: string;
}

export interface DashboardData {
  profile: DashboardProfile | null;
  preference: DashboardPreference | null;
  resumes: DashboardResume[];
  jobs: DashboardJob[];
}

export interface OnboardingStep {
  key: 'profile' | 'preferences' | 'resumes' | 'jobs';
  completed: boolean;
}

export interface OnboardingState {
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  isSetupComplete: boolean;
}

export async function fetchDashboardData(token?: string): Promise<DashboardData> {
  if (!token) {
    return { profile: null, preference: null, resumes: [], jobs: [] };
  }

  const headers = { Cookie: `jobpilot_token=${token}` };

  const [profileRes, prefRes, resumesRes, jobsRes] = await Promise.allSettled([
    fetch(`${API_BASE_URL}/api/profile`, { headers, cache: 'no-store' }),
    fetch(`${API_BASE_URL}/api/job-preferences`, { headers, cache: 'no-store' }),
    fetch(`${API_BASE_URL}/api/resumes`, { headers, cache: 'no-store' }),
    fetch(`${API_BASE_URL}/api/jobs`, { headers, cache: 'no-store' }),
  ]);

  const profile =
    profileRes.status === 'fulfilled' && profileRes.value.ok
      ? ((await profileRes.value.json()) as { profile: DashboardProfile | null }).profile
      : null;

  const preference =
    prefRes.status === 'fulfilled' && prefRes.value.ok
      ? ((await prefRes.value.json()) as { preference: DashboardPreference | null }).preference
      : null;

  const resumes =
    resumesRes.status === 'fulfilled' && resumesRes.value.ok
      ? ((await resumesRes.value.json()) as { resumes: DashboardResume[] }).resumes ?? []
      : [];

  const jobs =
    jobsRes.status === 'fulfilled' && jobsRes.value.ok
      ? ((await jobsRes.value.json()) as { jobs: DashboardJob[] }).jobs ?? []
      : [];

  return {
    profile,
    preference,
    resumes,
    jobs,
  };
}

export async function fetchRecruiterJobs(token?: string): Promise<RecruiterJobsResult> {
  if (!token) {
    return { jobs: [], error: 'Votre session a expire. Reconnectez-vous pour acceder a vos offres.' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs/mine`, {
      headers: { Cookie: `jobpilot_token=${token}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      return { jobs: [], error: await parseApiError(response) };
    }

    const data = (await response.json()) as { jobs: RecruiterJob[] };
    return { jobs: data.jobs ?? [] };
  } catch {
    return { jobs: [], error: 'Impossible de charger vos offres. Verifiez la connexion a JobPilot.' };
  }
}

export async function fetchRecruiterApplicationsOverview(token?: string): Promise<RecruiterApplicationsOverview> {
  if (!token) {
    return { totalApplications: 0, statusCounts: {}, recent: [], error: 'Votre session a expire. Reconnectez-vous pour acceder au pipeline.' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/applications/recruiter/overview`, {
      headers: { Cookie: `jobpilot_token=${token}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      return { totalApplications: 0, statusCounts: {}, recent: [], error: await parseApiError(response) };
    }

    return (await response.json()) as RecruiterApplicationsOverview;
  } catch {
    return { totalApplications: 0, statusCounts: {}, recent: [], error: 'Impossible de charger le pipeline. Verifiez la connexion a JobPilot.' };
  }
}

export function getOnboardingState(data: DashboardData): OnboardingState {
  const steps: OnboardingStep[] = [
    {
      key: 'profile',
      completed: Boolean(data.profile?.title || data.profile?.professionalSummary),
    },
    {
      key: 'preferences',
      completed: Boolean(data.preference?.jobTitles?.length || data.preference?.locations?.length),
    },
    {
      key: 'resumes',
      completed: data.resumes.length > 0,
    },
    {
      key: 'jobs',
      completed: data.jobs.length > 0,
    },
  ];

  const completedCount = steps.filter((step) => step.completed).length;
  const totalCount = steps.length;

  return {
    steps,
    completedCount,
    totalCount,
    progressPercent: Math.round((completedCount / totalCount) * 100),
    isSetupComplete: completedCount === totalCount,
  };
}
