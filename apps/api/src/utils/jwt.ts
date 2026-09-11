import jwt from 'jsonwebtoken';
import { config } from '../../../../packages/config/src/config';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: 'CANDIDATE' | 'RECRUITER' | 'ADMIN';
}

const TOKEN_EXPIRY = '7d';

/**
 * Sign a JWT for an authenticated user.
 */
export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, config.AUTH_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * Verify and decode a JWT. Throws if the token is invalid or expired.
 */
export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, config.AUTH_SECRET) as AuthTokenPayload;
}
