import { Router } from 'express';
import {
  getNotificationById,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notificationController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, listNotifications);
router.get('/:id', requireAuth, getNotificationById);
router.patch('/read-all', requireAuth, markAllNotificationsRead);
router.patch('/:id/read', requireAuth, markNotificationRead);

export default router;
