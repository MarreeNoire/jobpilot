import { Router } from 'express';
import {
  getAdminStats,
  getUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getActivityLogs,
  getSystemHealth
} from '../controllers/adminController';
import { requireAdminAuth } from '../middleware/adminAuth';

const router = Router();

// All admin routes require admin authentication
router.use(requireAdminAuth);

// Statistics and overview
router.get('/stats', getAdminStats);
router.get('/health', getSystemHealth);

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Activity monitoring
router.get('/activities', getActivityLogs);

export default router;