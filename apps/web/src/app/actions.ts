'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { appendFileSync } from 'fs';
import { API_BASE_URL, getSetCookieHeader, parseApiError } from '@/lib/api';

function debugLog(label: string, data: unknown): void {
  try {
    appendFileSync(
      'C:\\Projets_informatiques\\searchjob\\debug-role.log',
      `[web:${label}] ${new Date().toISOString()} ${JSON.stringify(data)}\n`
    );
  } catch {
    // ignore debug logging failures
  }
}

export interface AuthFormState {
  error?: string;
}

type AuthenticatedRole = 'CANDIDATE' | 'RECRUITER';

interface AuthResponse {
  user: {
    role: AuthenticatedRole;
  };
}

const API_UNAVAILABLE_MESSAGE =
  "Le service d'authentification est momentanément indisponible. Vérifiez que l'API JobPilot est démarrée, puis réessayez.";

function extractCookieValue(setCookieHeader: string): string | null {
  const firstPart = setCookieHeader.split(';')[0];
  const separatorIndex = firstPart.indexOf('=');

  if (separatorIndex === -1) {
    return null;
  }

  return firstPart.slice(separatorIndex + 1);
}

async function persistSessionFromResponse(response: Response): Promise<void> {
  const setCookieHeader = getSetCookieHeader(response);

  if (!setCookieHeader) {
    throw new Error('Authentication cookie was not returned by the API');
  }

  const token = extractCookieValue(setCookieHeader);
  if (!token) {
    throw new Error('Failed to extract authentication token');
  }

  const cookieStore = await cookies();
  cookieStore.set('jobpilot_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

async function redirectToRoleDashboard(response: Response): Promise<never> {
  const data = (await response.json()) as AuthResponse;
  redirect(data.user.role === 'RECRUITER' ? '/dashboard/recruiter' : '/dashboard');
}

export async function registerAction(
  _previousState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  debugLog('formData.role.raw', formData.get('role'));

  const payload = {
    firstName: String(formData.get('firstName') ?? '').trim(),
    lastName: String(formData.get('lastName') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim(),
    phone: String(formData.get('phone') ?? '').trim() || undefined,
    role: String(formData.get('role') ?? 'CANDIDATE').trim(),
    password: String(formData.get('password') ?? ''),
  };

  debugLog('payload', { ...payload, password: '***' });

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
  } catch (error) {
    console.error('[auth] Registration API request failed', error);
    return { error: API_UNAVAILABLE_MESSAGE };
  }

  if (!response.ok) {
    const errText = await response.clone().text();
    debugLog('register.error', { status: response.status, body: errText });
    return { error: await parseApiError(response) };
  }

  const cloned = response.clone();
  debugLog('register.response.body', await cloned.json());

  await persistSessionFromResponse(response);
  return redirectToRoleDashboard(response);
}

export async function loginAction(
  _previousState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const payload = {
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
  };

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
  } catch (error) {
    console.error('[auth] Login API request failed', error);
    return { error: API_UNAVAILABLE_MESSAGE };
  }

  if (!response.ok) {
    return { error: await parseApiError(response) };
  }

  await persistSessionFromResponse(response);
  return redirectToRoleDashboard(response);
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get('jobpilot_token')?.value;

  if (token) {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: `jobpilot_token=${token}`,
      },
      cache: 'no-store',
    });
  }

  cookieStore.delete('jobpilot_token');
  redirect('/login');
}

export interface OtpRequestState {
  error?: string;
}

export async function requestOtpAction(
  email: string,
  role: AuthenticatedRole
): Promise<OtpRequestState> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), role }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return { error: await parseApiError(response) };
    }

    return {};
  } catch (error) {
    console.error('[auth] OTP request failed', error);
    return { error: API_UNAVAILABLE_MESSAGE };
  }
}

export async function verifyOtpAction(
  email: string,
  code: string
): Promise<AuthFormState> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), code }),
      cache: 'no-store',
    });
  } catch (error) {
    console.error('[auth] OTP verify failed', error);
    return { error: API_UNAVAILABLE_MESSAGE };
  }

  if (!response.ok) {
    return { error: await parseApiError(response) };
  }

  await persistSessionFromResponse(response);
  return redirectToRoleDashboard(response);
}
