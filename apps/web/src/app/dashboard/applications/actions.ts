'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { API_BASE_URL, parseApiError } from '@/lib/api';

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  resumeId: string | null;
  coverLetterId: string | null;
  status:
    | 'DRAFT'
    | 'PENDING'
    | 'PROCESSING'
    | 'WAITING_USER'
    | 'SUBMITTED'
    | 'REVIEWING'
    | 'SHORTLISTED'
    | 'INTERVIEW_SCHEDULED'
    | 'FAILED'
    | 'REJECTED'
    | 'INTERVIEW'
    | 'ACCEPTED';
  compatibilityScore: number | null;
  hiringMessage: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  source: 'AUTOMATIC' | 'MANUAL';
  job?: {
    id: string;
    title: string;
    company: string;
    platform: string;
    url: string;
  };
}

export interface ApplicationFormState {
  error?: string;
  success?: string;
}


export async function createApplicationAction(
  _previousState: ApplicationFormState,
  formData: FormData
): Promise<ApplicationFormState> {
  const cookieStore = await cookies();
  const token = cookieStore.get('jobpilot_token')?.value;

  if (!token) {
    return { error: 'Authentication required' };
  }

  const payload = {
    jobId: String(formData.get('jobId') ?? '').trim(),
    resumeId: String(formData.get('resumeId') ?? '').trim() || undefined,
    status: 'DRAFT',
  };

  const response = await fetch(`${API_BASE_URL}/api/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `jobpilot_token=${token}`,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    return { error: await parseApiError(response) };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/jobs');
  revalidatePath('/dashboard/applications');

  return { success: 'Application created successfully.' };
}

export async function updateApplicationStatusAction(
  applicationId: string,
  status: Application['status']
): Promise<{ error?: string; success?: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get('jobpilot_token')?.value;

  if (!token) {
    return { error: 'Authentication required' };
  }

  const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `jobpilot_token=${token}`,
    },
    body: JSON.stringify({ status }),
    cache: 'no-store',
  });

  if (!response.ok) {
    return { error: await parseApiError(response) };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/applications');

  return { success: 'Status updated successfully.' };
}
