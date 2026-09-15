'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { API_BASE_URL, parseApiError } from '@/lib/api';

export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'CLOSED';

export interface Job {
  id: string;
  platform: string;
  platformId: string;
  title: string;
  company: string;
  description: string | null;
  location: string | null;
  salary: string | null;
  contactEmail?: string | null;
  url: string;
  postedAt: string | null;
  retrievedAt: string;
  status: JobStatus;
  applicationsCount?: number;
}

export interface JobFormState {
  error?: string;
  success?: string;
}

export async function createJobAction(
  _previousState: JobFormState,
  formData: FormData
): Promise<JobFormState> {
  const cookieStore = await cookies();
  const token = cookieStore.get('jobpilot_token')?.value;

  if (!token) {
    return { error: 'Authentication required' };
  }

  const payload = {
    platform: String(formData.get('platform') ?? '').trim(),
    platformId: String(formData.get('platformId') ?? '').trim(),
    title: String(formData.get('title') ?? '').trim(),
    company: String(formData.get('company') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim() || undefined,
    location: String(formData.get('location') ?? '').trim() || undefined,
    salary: String(formData.get('salary') ?? '').trim() || undefined,
    contactEmail: String(formData.get('contactEmail') ?? '').trim() || undefined,
    url: String(formData.get('url') ?? '').trim(),
  };

  const response = await fetch(`${API_BASE_URL}/api/jobs`, {
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

  return { success: 'Job added successfully.' };
}


export async function updateJobStatusAction(
  jobId: string,
  status: JobStatus
): Promise<JobFormState> {
  const cookieStore = await cookies();
  const token = cookieStore.get('jobpilot_token')?.value;

  if (!token) {
    return { error: 'Authentication required' };
  }

  const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/status`, {
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
  revalidatePath('/dashboard/jobs');
  revalidatePath(`/dashboard/jobs/${jobId}`);

  return { success: 'Job status updated.' };
}
