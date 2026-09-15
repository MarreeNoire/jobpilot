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
    <header className="flex flex-col gap-4 rounded-2xl border border-blue-800/40 bg-gradient-to-r from-blue-700 to-blue-600 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white shadow-md ring-1 ring-white/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">JobPilot</span>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white border border-white/20">
                {roleLabel}
              </span>
            </div>
            <p className="text-xs text-blue-50/80">{subtitle}</p>
          </div>
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-white/15 pt-3 sm:border-0 sm:pt-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white ring-2 ring-white/20">
            {initials || <UserIcon className="h-4 w-4" />}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white leading-tight">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-blue-50/70 leading-tight">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell initialNotifications={notifications} initialUnreadCount={unreadCount} />

          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-white/20"
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
