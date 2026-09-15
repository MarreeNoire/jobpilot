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
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const skip = (page - 1) * limit;

  const [notifications, unreadCount, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({
      where: { userId: req.userId, isRead: false },
    }),
    prisma.notification.count({
      where: { userId: req.userId },
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
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}

/**
 * Récupère une notification précise par son ID. Renvoie 404 si non trouvée ou
 * n'appartient pas à l'utilisateur connecté.
 */
export async function getNotificationById(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;

  const notification = await prisma.notification.findFirst({
    where: { id, userId: req.userId },
  });

  if (!notification) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }

  res.status(200).json({
    id: notification.id,
    title: notification.title,
    body: notification.body,
    link: notification.link,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
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
