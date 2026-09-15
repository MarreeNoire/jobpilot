import Link from 'next/link';
import { requireCurrentUser } from '@/lib/auth';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import { getNotificationById, markNotificationReadAction } from '@/app/dashboard/notifications/actions';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Bell, Briefcase, CheckCircle2, Loader2, Mail, MapPin, Users, XCircle } from 'lucide-react';

export default async function NotificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCurrentUser();
  const { id } = await params;

  const notification = await getNotificationById(id);

  // If notification not found or doesn't belong to user (getNotificationById returns null), show 404
  if (!notification) {
    notFound();
  }

  // Mark as read when viewing the detail page in background
  markNotificationReadAction(id).catch(() => {});

  return (
    <main className="min-h-screen bg-slate-50/60 p-4 sm:p-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <DashboardHeader user={user} />
        <DashboardNav role={user.role} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Notification
              </h1>
              <p className="text-xs text-slate-500">
                {notification.isRead ? 'Lu' : 'Non lu'}
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/notifications"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Toutes les notifications</span>
          </Link>
        </div>

        {/* Notification Detail Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {notification.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {new Date(notification.createdAt).toLocaleString('fr-FR', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
              </div>

              {/* Status indicator */}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                notification.isRead ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
              }`}>
                {notification.isRead ? 'Lu' : 'Nouveau'}
              </div>
            </div>

            {/* Body */}
            <div className="prose prose-sm max-w-none">
              <p className="text-slate-600 leading-relaxed">
                {notification.body}
              </p>
            </div>

            {/* Action button if link exists */}
            {notification.link && notification.link !== `/dashboard/notifications/${id}` && (
              <div className="mt-4">
                <Link
                  href={notification.link.startsWith('/') ? notification.link : `/${notification.link}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  {notification.link.includes('/dashboard/applications') ? (
                    <>
                      <Users className="h-4 w-4" />
                      <span>Voir les candidatures</span>
                    </>
                  ) : notification.link.includes('/dashboard/jobs') ? (
                    <>
                      <Briefcase className="h-4 w-4" />
                      <span>Voir l'offre</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-3.5 w-3.5" />
                      <span>Voir les détails</span>
                    </>
                  )}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}