'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { API_BASE_URL, parseApiError } from '@/lib/api';

export interface JobPreference {
  id: string;
  userId: string;
  jobTitles: string[];
  locations: string[];
  remote: boolean;
  minSalary: number | null;
  contractTypes: string[];
  industries: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JobPreferenceFormState {
  error?: string;
  success?: string;
}

function parseList(value: FormDataEntryValue | null): string[] {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function saveJobPreferencesAction(
  _previousState: JobPreferenceFormState,
  formData: FormData
): Promise<JobPreferenceFormState> {
  const cookieStore = await cookies();
  const token = cookieStore.get('jobpilot_token')?.value;

  if (!token) {
    return { error: 'Authentication required' };
  }

  const minSalaryValue = String(formData.get('minSalary') ?? '').trim();

  const payload = {
    jobTitles: parseList(formData.get('jobTitles')),
    locations: parseList(formData.get('locations')),
    remote: formData.get('remote') === 'on',
    minSalary: minSalaryValue === '' ? undefined : Number(minSalaryValue),
    contractTypes: parseList(formData.get('contractTypes')),
    industries: parseList(formData.get('industries')),
  };

  const response = await fetch(`${API_BASE_URL}/api/job-preferences`, {
    method: 'PUT',
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
  revalidatePath('/dashboard/preferences');

  return { success: 'Preferences saved successfully.' };
}
