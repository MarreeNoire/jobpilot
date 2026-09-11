import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken } from '../utils/jwt';

export const AUTH_COOKIE_NAME = 'jobpilot_token';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: 'CANDIDATE' | 'RECRUITER' | 'ADMIN';
}

/**
 * Protects a route: requires a valid session cookie.
 * On success, attaches userId/userEmail to the request.
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : undefined;
  const token = req.cookies?.[AUTH_COOKIE_NAME] || bearerToken;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    req.userId = payload.userId;
    req.userEmail = payload.email;
    req.userRole = payload.role;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}
