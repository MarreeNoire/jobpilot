'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { API_BASE_URL, parseApiError } from '@/lib/api';

export interface CoverLetter {
  id: string;
  title: string;
  content: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CoverLetterFormState {
  error?: string;
  success?: string;
}

async function getToken() {
  const store = await cookies();
  return store.get('jobpilot_token')?.value;
}

export async function getCoverLettersAction(): Promise<CoverLetter[]> {
  const token = await getToken();
  if (!token) return [];
  const res = await fetch(`${API_BASE_URL}/api/cover-letters`, {
    headers: { Cookie: `jobpilot_token=${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return ((await res.json()) as { coverLetters: CoverLetter[] }).coverLetters ?? [];
}

export async function createCoverLetterAction(
  _prev: CoverLetterFormState,
  formData: FormData
): Promise<CoverLetterFormState> {
  const token = await getToken();
  if (!token) return { error: 'Authentication required' };

  const payload = {
    title: String(formData.get('title') ?? '').trim(),
    content: String(formData.get('content') ?? '').trim(),
    isPrimary: formData.get('isPrimary') === 'on',
  };

  if (!payload.title || !payload.content) {
    return { error: 'Le titre et le contenu sont requis.' };
  }

  const res = await fetch(`${API_BASE_URL}/api/cover-letters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `jobpilot_token=${token}` },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!res.ok) return { error: await parseApiError(res) };

  revalidatePath('/dashboard/cover-letters');
  return { success: 'Lettre de motivation créée.' };
}

export async function updateCoverLetterAction(
  id: string,
  _prev: CoverLetterFormState,
  formData: FormData
): Promise<CoverLetterFormState> {
  const token = await getToken();
  if (!token) return { error: 'Authentication required' };

  const payload = {
    title: String(formData.get('title') ?? '').trim(),
    content: String(formData.get('content') ?? '').trim(),
    isPrimary: formData.get('isPrimary') === 'on',
  };

  const res = await fetch(`${API_BASE_URL}/api/cover-letters/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: `jobpilot_token=${token}` },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!res.ok) return { error: await parseApiError(res) };

  revalidatePath('/dashboard/cover-letters');
  return { success: 'Lettre mise à jour.' };
}

export async function deleteCoverLetterAction(id: string): Promise<{ error?: string }> {
  const token = await getToken();
  if (!token) return { error: 'Authentication required' };

  const res = await fetch(`${API_BASE_URL}/api/cover-letters/${id}`, {
    method: 'DELETE',
    headers: { Cookie: `jobpilot_token=${token}` },
    cache: 'no-store',
  });

  if (!res.ok) return { error: await parseApiError(res) };

  revalidatePath('/dashboard/cover-letters');
  return {};
}
