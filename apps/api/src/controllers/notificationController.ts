import { Response } from 'express';
import { prisma } from '../../../../packages/database/src/index';
import type { AuthenticatedRequest } from '../middleware/auth';

/**
 * Liste les notifications de l'utilisateur connecte (candidat ou recruteur),
 * les plus recentes en premier, avec le nombre de notifications non lues.
 */
export async function listNotifications(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.notification.count({
      where: { userId: req.userId, isRead: false },
    }),
  ]);

  res.status(200).json({
    notifications: notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      link: notification.link,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    })),
    unreadCount,
  });
}

/**
 * Marque une notification precise comme lue. Une notification n'appartenant
 * pas a l'utilisateur connecte renvoie 404 (aucune fuite d'information).
 */
export async function markNotificationRead(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;

  const existing = await prisma.notification.findFirst({
    where: { id, userId: req.userId },
  });

  if (!existing) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  res.status(200).json({
    notification: {
      id: updated.id,
      title: updated.title,
      body: updated.body,
      link: updated.link,
      isRead: updated.isRead,
      createdAt: updated.createdAt.toISOString(),
    },
  });
}

/**
 * Marque toutes les notifications de l'utilisateur connecte comme lues.
 */
export async function markAllNotificationsRead(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId: req.userId, isRead: false },
    data: { isRead: true },
  });

  res.status(200).json({ success: true });
}
