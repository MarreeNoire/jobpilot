'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { API_BASE_URL, parseApiError } from '@/lib/api';
import type { Application } from '@/app/dashboard/applications/actions';

export interface RecruiterCandidateSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

export interface RecruiterApplication {
  id: string;
  userId: string;
  jobId: string;
  resumeId: string | null;
  coverLetterId: string | null;
  status: Application['status'];
  compatibilityScore: number | null;
  recruiterNotes: string | null;
  hiringMessage: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  candidate: RecruiterCandidateSummary;
  resume: { id: string; title: string; fileUrl: string | null; fileName: string | null } | null;
  coverLetter: { id: string; title: string } | null;
  job?: { id: string; title: string; company: string };
}

export interface RecruiterApplicationActionState {
  error?: string;
  success?: string;
}

export interface RecruiterApplicationsResult {
  applications: RecruiterApplication[];
  error?: string;
}

async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('jobpilot_token')?.value;
}

export async function getRecruiterApplications(): Promise<RecruiterApplicationsResult> {
  const token = await getToken();

  if (!token) {
    return { applications: [], error: 'Votre session a expire. Reconnectez-vous pour voir les candidatures.' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/applications/recruiter`, {
      headers: { Cookie: `jobpilot_token=${token}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      return { applications: [], error: await parseApiError(response) };
    }

    const data = (await response.json()) as { applications: RecruiterApplication[] };
    return { applications: data.applications ?? [] };
  } catch {
    return { applications: [], error: 'Impossible de charger les candidatures. Verifiez la connexion a JobPilot.' };
  }
}

export async function getApplicationsForJob(
  jobId: string
): Promise<{ jobTitle: string; company: string; applications: RecruiterApplication[] }> {
  const token = await getToken();

  if (!token) {
    return { jobTitle: '', company: '', applications: [] };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/applications/job/${jobId}`, {
      headers: { Cookie: `jobpilot_token=${token}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      return { jobTitle: '', company: '', applications: [] };
    }

  const data = (await response.json()) as {
    job: { title: string; company: string };
    applications: RecruiterApplication[];
  };

    return { jobTitle: data.job.title, company: data.job.company, applications: data.applications };
  } catch {
    return { jobTitle: '', company: '', applications: [] };
  }
}

export interface RecruiterApplicationDetail {
  id: string;
  status: Application['status'];
  compatibilityScore: number | null;
  recruiterNotes: string | null;
  hiringMessage: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  job: { id: string; title: string; company: string };
  resume: {
    id: string;
    title: string;
    fileUrl: string | null;
    fileName: string | null;
    fileMimeType: string | null;
  } | null;
  coverLetter: { id: string; title: string; content: string } | null;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    profile: {
      title: string | null;
      professionalSummary: string | null;
      yearsOfExperience: number | null;
      availability: string | null;
    } | null;
    experiences: Array<{
      id: string;
      company: string;
      position: string;
      startDate: string;
      endDate: string | null;
      description: string | null;
      achievements: string[];
    }>;
    educations: Array<{
      id: string;
      institution: string;
      degree: string;
      fieldOfStudy: string | null;
      startDate: string;
      endDate: string | null;
    }>;
    skills: Array<{ id: string; name: string; level: number | null }>;
  };
  interviews: RecruiterInterview[];
  activities: RecruiterApplicationActivity[];
}

export interface RecruiterInterview {
  id: string;
  applicationId: string;
  createdByUserId: string;
  scheduledAt: string;
  timezone: string;
  mode: 'VIDEO' | 'PHONE' | 'ONSITE';
  meetingUrl: string | null;
  notes: string | null;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  createdAt: string;
  updatedAt: string;
}

export interface RecruiterApplicationActivity {
  id: string;
  applicationId: string;
  actorUserId: string | null;
  actor: { id: string; firstName: string; lastName: string } | null;
  type: 'STATUS_CHANGED' | 'RECRUITER_NOTE_UPDATED' | 'INTERVIEW_SCHEDULED';
  fromStatus: Application['status'] | null;
  toStatus: Application['status'] | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export async function getApplicationDetail(
  applicationId: string
): Promise<RecruiterApplicationDetail | null> {
  const token = await getToken();

  if (!token) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}`, {
    headers: { Cookie: `jobpilot_token=${token}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { application: RecruiterApplicationDetail };
  return data.application;
}

export async function updateApplicationStatusByRecruiterAction(
  jobId: string,
  applicationId: string,
  status: Application['status'],
  message?: string
): Promise<RecruiterApplicationActionState> {
  const token = await getToken();

  if (!token) {
    return { error: 'Authentication required' };
  }

  const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `jobpilot_token=${token}`,
    },
    body: JSON.stringify({ status, message: message?.trim() || undefined }),
    cache: 'no-store',
  });

  if (!response.ok) {
    return { error: await parseApiError(response) };
  }

  revalidatePath(`/dashboard/jobs/${jobId}/applications`);
  revalidatePath(`/dashboard/jobs/${jobId}/applications/${applicationId}`);

  return { success: 'Statut mis à jour et candidat notifié.' };
}

export async function updateRecruiterNoteAction(
  jobId: string,
  applicationId: string,
  recruiterNotes: string
): Promise<RecruiterApplicationActionState> {
  const token = await getToken();

  if (!token) {
    return { error: 'Authentication required' };
  }

  const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/notes`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `jobpilot_token=${token}`,
    },
    body: JSON.stringify({ recruiterNotes }),
    cache: 'no-store',
  });

  if (!response.ok) {
    return { error: await parseApiError(response) };
  }

  revalidatePath(`/dashboard/jobs/${jobId}/applications`);
  revalidatePath(`/dashboard/jobs/${jobId}/applications/${applicationId}`);

  return { success: 'Note interne enregistrée.' };
}

export async function scheduleInterviewAction(
  jobId: string,
  applicationId: string,
  interview: {
    scheduledAt: string;
    timezone: string;
    mode: 'VIDEO' | 'PHONE' | 'ONSITE';
    meetingUrl?: string;
    notes?: string;
  }
): Promise<RecruiterApplicationActionState> {
  const token = await getToken();

  if (!token) {
    return { error: 'Authentication required' };
  }

  const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/interviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `jobpilot_token=${token}`,
    },
    body: JSON.stringify(interview),
    cache: 'no-store',
  });

  if (!response.ok) {
    return { error: await parseApiError(response) };
  }

  revalidatePath(`/dashboard/jobs/${jobId}/applications`);
  revalidatePath(`/dashboard/jobs/${jobId}/applications/${applicationId}`);

  return { success: 'Entretien planifié et candidat notifié.' };
}

export async function acceptApplicationAction(
  jobId: string,
  applicationId: string,
  hiringMessage: string
): Promise<RecruiterApplicationActionState> {
  const token = await getToken();

  if (!token) {
    return { error: 'Authentication required' };
  }

  if (!hiringMessage.trim()) {
    return { error: "Un message de confirmation ou une promesse d'embauche est requis." };
  }

  const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/accept`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `jobpilot_token=${token}`,
    },
    body: JSON.stringify({ hiringMessage }),
    cache: 'no-store',
  });

  if (!response.ok) {
    return { error: await parseApiError(response) };
  }

  revalidatePath(`/dashboard/jobs/${jobId}/applications`);
  revalidatePath(`/dashboard/jobs/${jobId}/applications/${applicationId}`);

  return { success: 'Candidature validée. Le candidat a été notifié.' };
}
