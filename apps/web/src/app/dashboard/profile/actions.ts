'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { API_BASE_URL, parseApiError } from '@/lib/api';

export interface Profile {
  id: string;
  userId: string;
  title: string | null;
  professionalSummary: string | null;
  yearsOfExperience: number | null;
  availability: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileFormState {
  error?: string;
  success?: string;
}

export async function saveProfileAction(
  _previousState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const cookieStore = await cookies();
  const token = cookieStore.get('jobpilot_token')?.value;

  if (!token) {
    return { error: 'Authentication required' };
  }

  const yearsOfExperienceValue = String(formData.get('yearsOfExperience') ?? '').trim();

  const payload = {
    title: String(formData.get('title') ?? '').trim() || undefined,
    professionalSummary:
      String(formData.get('professionalSummary') ?? '').trim() || undefined,
    yearsOfExperience:
      yearsOfExperienceValue === '' ? undefined : Number(yearsOfExperienceValue),
    availability: String(formData.get('availability') ?? '').trim() || undefined,
  };

  const response = await fetch(`${API_BASE_URL}/api/profile`, {
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
  revalidatePath('/dashboard/profile');

  return { success: 'Profile saved successfully.' };
}
