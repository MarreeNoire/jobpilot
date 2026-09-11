import { Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from './auth';

/**
 * Protects admin routes: requires authentication and ADMIN role.
 * On success, attaches userId/userEmail to the request.
 */
export function requireAdminAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // First check if user is authenticated
  requireAuth(req, res, (error) => {
    if (error) {
      return; // requireAuth already sent the error response
    }

    // Then check if user has ADMIN role
    if (req.userRole !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    next();
  });
}