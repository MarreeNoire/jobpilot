export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';

export type UserRole = 'CANDIDATE' | 'RECRUITER' | 'ADMIN';

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string | null;
  createdAt?: string;
}

export interface ApiErrorPayload {
  error?: string;
  message?: string;
}

export async function parseApiError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as ApiErrorPayload;
    return data.error ?? data.message ?? 'Unexpected server error';
  } catch {
    return 'Unexpected server error';
  }
}

export function getSetCookieHeader(response: Response): string | null {
  const headersWithGetSetCookie = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headersWithGetSetCookie.getSetCookie === 'function') {
    const cookies = headersWithGetSetCookie.getSetCookie();
    return cookies[0] ?? null;
  }

  return response.headers.get('set-cookie');
}
