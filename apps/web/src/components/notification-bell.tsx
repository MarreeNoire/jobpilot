'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import {
  getNotifications,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  type AppNotification,
} from '@/app/dashboard/notifications/actions';

interface NotificationBellProps {
  initialNotifications: AppNotification[];
  initialUnreadCount: number;
}

const POLL_INTERVAL_MS = 30_000;

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / (1000 * 60));
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `il y a ${diffHours} h`;
  const diffDays = Math.round(diffHours / 24);
  return `il y a ${diffDays} j`;
}

export function NotificationBell({ initialNotifications, initialUnreadCount }: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  // Ferme le dropdown au clic en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Rafraîchit périodiquement le compteur / la liste en arrière-plan
  useEffect(() => {
    const interval = setInterval(() => {
      getNotifications().then((result) => {
        setNotifications(result.notifications);
        setUnreadCount(result.unreadCount);
      });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      // Rafraîchit à l'ouverture pour avoir les dernières notifications
      startTransition(async () => {
        const result = await getNotifications();
        setNotifications(result.notifications);
        setUnreadCount(result.unreadCount);
      });
    }
  }

  function handleNotificationClick(notification: AppNotification) {
    setOpen(false);

    const target = notification.link ?? '/dashboard/notifications';

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

  const recentNotifications = notifications.slice(0, 8);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[340px] max-w-[90vw] rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Bell className="h-6 w-6 text-slate-300" />
                <p className="text-xs text-slate-500">Aucune notification pour le moment.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentNotifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left transition hover:bg-slate-50 ${
                        notification.isRead ? '' : 'bg-blue-50/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-bold ${notification.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className="line-clamp-2 text-xs text-slate-500">{notification.body}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{timeAgo(notification.createdAt)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-2.5 text-center">
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Voir toutes les notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
