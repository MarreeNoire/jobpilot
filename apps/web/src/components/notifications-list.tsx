'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
  type AppNotification,
} from '@/app/dashboard/notifications/actions';

interface NotificationsListProps {
  initialNotifications: AppNotification[];
  initialUnreadCount: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function NotificationsList({ initialNotifications, initialUnreadCount }: NotificationsListProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isPending, startTransition] = useTransition();

  function handleMarkRead(notification: AppNotification) {
    const target = `/dashboard/notifications/${notification.id}`;

    if (!notification.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Navigate first, then mark as read in background
      router.push(target);
      startTransition(async () => {
        await markNotificationReadAction(notification.id);
        // Note: We don't handle errors here as navigation already happened
      });
    } else {
      router.push(target);
    }
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    startTransition(async () => {
      await markAllNotificationsReadAction();
    });
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
          <Bell className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-900">Aucune notification</h3>
        <p className="mt-2 max-w-sm text-xs text-slate-500">
          Vous serez averti ici dès qu'un recruteur fera évoluer une de vos candidatures.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
            Tout marquer comme lu
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <ul className="divide-y divide-slate-100">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <button
                type="button"
                onClick={() => handleMarkRead(notification)}
                className={`flex w-full flex-col gap-1 px-5 py-4 text-left transition hover:bg-slate-50 ${
                  notification.isRead ? '' : 'bg-blue-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className={`text-sm font-bold ${notification.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                    {notification.title}
                  </p>
                  {!notification.isRead && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  )}
                </div>
                <p className="text-sm text-slate-600">{notification.body}</p>
                <p className="mt-1 text-xs text-slate-400">{formatDate(notification.createdAt)}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
