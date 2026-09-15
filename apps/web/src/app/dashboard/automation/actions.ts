'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { API_BASE_URL, parseApiError } from '@/lib/api';

export interface AutomationRule {
  id: string;
  name: string;
  keywords: string[];
  locations: string[];
  contractTypes: string[];
  minScore: number | null;
  resumeId: string | null;
  coverLetterId: string | null;
  autoApply: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationFormState { error?: string; success?: string; }

async function getToken() {
  const store = await cookies();
  return store.get('jobpilot_token')?.value;
}

export async function getAutomationRulesAction(): Promise<AutomationRule[]> {
  const token = await getToken();
  if (!token) return [];
  const res = await fetch(`${API_BASE_URL}/api/automation-rules`, {
    headers: { Cookie: `jobpilot_token=${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return ((await res.json()) as { rules: AutomationRule[] }).rules ?? [];
}

export async function createAutomationRuleAction(
  _prev: AutomationFormState,
  formData: FormData
): Promise<AutomationFormState> {
  const token = await getToken();
  if (!token) return { error: 'Authentication required' };

  const payload = {
    name: String(formData.get('name') ?? '').trim(),
    keywords: String(formData.get('keywords') ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    locations: String(formData.get('locations') ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    contractTypes: String(formData.get('contractTypes') ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    minScore: Number(formData.get('minScore') ?? 0) || null,
    autoApply: formData.get('autoApply') === 'on',
    resumeId: String(formData.get('resumeId') ?? '').trim() || null,
    coverLetterId: String(formData.get('coverLetterId') ?? '').trim() || null,
  };

  if (!payload.name) return { error: 'Le nom de la règle est requis.' };

  const res = await fetch(`${API_BASE_URL}/api/automation-rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `jobpilot_token=${token}` },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!res.ok) return { error: await parseApiError(res) };
  revalidatePath('/dashboard/automation');
  return { success: 'Règle créée avec succès.' };
}

export async function deleteAutomationRuleAction(id: string): Promise<{ error?: string }> {
  const token = await getToken();
  if (!token) return { error: 'Authentication required' };

  const res = await fetch(`${API_BASE_URL}/api/automation-rules/${id}`, {
    method: 'DELETE',
    headers: { Cookie: `jobpilot_token=${token}` },
    cache: 'no-store',
  });

  if (!res.ok) return { error: await parseApiError(res) };
  revalidatePath('/dashboard/automation');
  return {};
}

export async function toggleAutoApplyAction(
  id: string,
  autoApply: boolean
): Promise<{ error?: string }> {
  const token = await getToken();
  if (!token) return { error: 'Authentication required' };

  const res = await fetch(`${API_BASE_URL}/api/automation-rules/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: `jobpilot_token=${token}` },
    body: JSON.stringify({ autoApply }),
    cache: 'no-store',
  });

  if (!res.ok) return { error: await parseApiError(res) };
  revalidatePath('/dashboard/automation');
  return {};
}
