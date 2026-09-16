'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { API_BASE_URL, parseApiError } from '@/lib/api';
import type { Job } from '@/app/dashboard/jobs/actions';
import type { Resume } from '@/app/dashboard/resumes/actions';

export interface CoverLetter {
  id: string;
  title: string;
  isPrimary: boolean;
}

export interface ApplyPageData {
  job: Job;
  resumes: Resume[];
  primaryResumeId: string | null;
  coverLetters: CoverLetter[];
}

export interface ApplyFormState {
  error?: string;
}

async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('jobpilot_token')?.value;
}

export async function getApplyPageData(jobId: string): Promise<ApplyPageData | null> {
  const token = await getToken();
  if (!token) return null;

  const headers = { Cookie: `jobpilot_token=${token}` };

  const [jobRes, resumesRes, coverLettersRes] = await Promise.all([
    fetch(`${API_BASE_URL}/api/jobs/${jobId}`, { headers, cache: 'no-store' }),
    fetch(`${API_BASE_URL}/api/resumes`, { headers, cache: 'no-store' }),
    fetch(`${API_BASE_URL}/api/cover-letters`, { headers, cache: 'no-store' }),
  ]);

  if (!jobRes.ok) {
    console.error('[apply] Job fetch failed', { jobId, status: jobRes.status, body: await jobRes.text() });
    return null;
  }

  const job = ((await jobRes.json()) as { job: Job }).job;

  const resumes: Resume[] = resumesRes.ok
    ? (((await resumesRes.json()) as { resumes: Resume[] }).resumes ?? [])
    : [];

  const coverLetters: CoverLetter[] = coverLettersRes.ok
    ? (((await coverLettersRes.json()) as { coverLetters: CoverLetter[] }).coverLetters ?? [])
    : [];

  const primaryResumeId = resumes.find((r) => r.isPrimary)?.id ?? resumes[0]?.id ?? null;

  return { job, resumes, primaryResumeId, coverLetters };
}

export async function submitApplicationAction(
  _prev: ApplyFormState,
  formData: FormData
): Promise<ApplyFormState> {
  const token = await getToken();
  if (!token) return { error: 'Session expirée, reconnectez-vous.' };

  const jobId = String(formData.get('jobId') ?? '').trim();
  const resumeId = String(formData.get('resumeId') ?? '').trim() || undefined;
  const coverLetterId = String(formData.get('coverLetterId') ?? '').trim() || undefined;

  if (!jobId) return { error: 'Offre introuvable.' };

  const response = await fetch(`${API_BASE_URL}/api/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `jobpilot_token=${token}`,
    },
    body: JSON.stringify({
      jobId,
      resumeId,
      coverLetterId,
      status: 'SUBMITTED',
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const err = await parseApiError(response);
    // Candidature déjà existante = traiter comme un succès
    if (err.toLowerCase().includes('already exists')) {
      redirect(`/dashboard/jobs/${jobId}/apply/success`);
    }
    return { error: err };
  }

  redirect(`/dashboard/jobs/${jobId}/apply/success`);
}
