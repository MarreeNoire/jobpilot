import { logoutAction } from '@/app/actions';
import { getNotifications } from '@/app/dashboard/notifications/actions';
import { NotificationBell } from '@/components/notification-bell';
import type { PublicUser } from '@/lib/api';
import { LogOut, Sparkles, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

interface DashboardHeaderProps {
  user: PublicUser;
}

export async function DashboardHeader({ user }: DashboardHeaderProps) {
  const { notifications, unreadCount } = await getNotifications();
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'JP';
  const roleLabel = user.role === 'RECRUITER' ? 'Espace recruteur' : 'Espace candidat';
  const subtitle =
    user.role === 'RECRUITER'
      ? "Gestion des offres et suivi du recrutement"
      : "Assistant IA de recherche d'emploi";

  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900">JobPilot</span>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60">
                {roleLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-sm font-semibold text-slate-700 ring-2 ring-blue-100">
            {initials || <UserIcon className="h-4 w-4" />}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-900 leading-tight">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-slate-500 leading-tight">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell initialNotifications={notifications} initialUnreadCount={unreadCount} />

          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-red-600 hover:border-red-200"
              title="Se déconnecter"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Déconnexion</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
