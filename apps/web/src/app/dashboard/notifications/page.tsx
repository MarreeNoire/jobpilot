import Link from 'next/link';
import { requireCurrentUser } from '@/lib/auth';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import { getNotifications } from './actions';
import { NotificationsList } from '@/components/notifications-list';
import { ArrowLeft, Bell } from 'lucide-react';

export default async function NotificationsPage() {
  const user = await requireCurrentUser();
  const { notifications, unreadCount } = await getNotifications();

  return (
    <main className="min-h-screen bg-slate-50/60 p-4 sm:p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <DashboardHeader user={user} />
        <DashboardNav role={user.role} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h1>
              <p className="text-xs text-slate-500">
                {unreadCount > 0
                  ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                  : 'Vous êtes à jour.'}
              </p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Tableau de bord</span>
          </Link>
        </div>

        <NotificationsList initialNotifications={notifications} initialUnreadCount={unreadCount} />
      </div>
    </main>
  );
}
