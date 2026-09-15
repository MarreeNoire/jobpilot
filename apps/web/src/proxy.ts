import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'jobpilot_token';
const protectedPaths = ['/dashboard'];
const guestOnlyPaths = ['/login', '/register'];

function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function getRoleFromToken(token: string): 'CANDIDATE' | 'RECRUITER' | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalizedPayload)) as { role?: unknown };

    return decoded.role === 'RECRUITER' || decoded.role === 'CANDIDATE'
      ? decoded.role
      : null;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  if (!token && matchesPath(pathname, protectedPaths)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && matchesPath(pathname, guestOnlyPaths)) {
    const role = getRoleFromToken(token);
    return NextResponse.redirect(
      new URL(role === 'RECRUITER' ? '/dashboard/recruiter' : '/dashboard', request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
