import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { API_BASE_URL, type PublicUser } from './api';

const AUTH_COOKIE_NAME = 'jobpilot_token';

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const token = await getSessionToken();

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        Cookie: `${AUTH_COOKIE_NAME}=${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { user: PublicUser };
    return data.user;
  } catch (error) {
    console.error('[auth] Failed to fetch current user', error);
    return null;
  }
}

export async function requireCurrentUser(): Promise<PublicUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

export async function hasAuthenticatedSession(): Promise<boolean> {
  const token = await getSessionToken();
  return Boolean(token);
}
