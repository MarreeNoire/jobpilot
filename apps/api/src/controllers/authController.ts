import { Request, Response } from 'express';
import { appendFileSync } from 'fs';
import { prisma } from '../../../../packages/database/src/index';
import { registerSchema, loginSchema } from '../../../../packages/validation/src/userValidation';
import type { z } from 'zod';
import { hashPassword, verifyPassword } from '../utils/password';
import { signAuthToken } from '../utils/jwt';
import { AUTH_COOKIE_NAME, AuthenticatedRequest } from '../middleware/auth';

function debugLog(label: string, data: unknown): void {
  try {
    appendFileSync(
      'C:\\Projets_informatiques\\searchjob\\debug-role.log',
      `[api:${label}] ${new Date().toISOString()} ${JSON.stringify(data)}\n`
    );
  } catch {
    // ignore debug logging failures
  }
}

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, matches TOKEN_EXPIRY in utils/jwt.ts

function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true, // not readable from client-side JS -> mitigates XSS token theft
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'lax', // mitigates CSRF while allowing normal navigation
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  });
}

// Fields safe to return to the client (never the password hash).
function toPublicUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CANDIDATE' | 'RECRUITER' | 'ADMIN';
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };
}

export async function register(req: Request, res: Response): Promise<void> {
  const data = req.body as z.infer<typeof registerSchema>;
  debugLog('register.req.body', data);

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    debugLog('register.existingUser', { email: existingUser.email, role: existingUser.role });
    res.status(409).json({ error: 'An account with this email already exists' });
    return;
  }

  const passwordHash = await hashPassword(data.password);

  const role = data.role ?? 'CANDIDATE';
  debugLog('register.role', { roleFromData: data.role, roleUsed: role });

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role,
    },
  });

  debugLog('register.created.user', { email: user.email, role: user.role });

  const token = signAuthToken({ userId: user.id, email: user.email, role: user.role });
  setAuthCookie(res, token);

  res.status(201).json({ user: toPublicUser(user) });
}

export async function login(req: Request, res: Response): Promise<void> {
  const data = req.body as z.infer<typeof loginSchema>;

  const user = await prisma.user.findUnique({ where: { email: data.email } });

  // Same generic error whether the email or the password is wrong,
  // so we don't reveal which accounts exist.
  if (!user || !user.password) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const isValid = await verifyPassword(data.password, user.password);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = signAuthToken({ userId: user.id, email: user.email, role: user.role });
  setAuthCookie(res, token);

  res.status(200).json({ user: toPublicUser(user) });
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
  res.status(200).json({ message: 'Logged out' });
}

export async function me(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  debugLog('me.result', { userId: req.userId, tokenRole: req.userRole, dbUser: user });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.status(200).json({ user });
}
