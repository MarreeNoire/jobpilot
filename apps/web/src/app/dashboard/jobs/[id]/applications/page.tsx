import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireCurrentUser } from '@/lib/auth';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import { KanbanBoard } from '@/components/kanban-board';
import { getApplicationsForJob } from './actions';
import { ArrowLeft, Briefcase, Users } from 'lucide-react';

export default async function JobApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCurrentUser();

  if (user.role !== 'RECRUITER') {
    redirect('/dashboard');
  }

  const { id: jobId } = await params;
  const { jobTitle, company, applications } = await getApplicationsForJob(jobId);

  return (
    <main className="min-h-screen bg-slate-50/60 p-4 sm:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <DashboardHeader user={user} />
        <DashboardNav role={user.role} />

        {/* En-tête de la page */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Retour à mes offres</span>
            </Link>

            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{jobTitle || 'Offre introuvable'}</h1>
                <p className="text-xs text-slate-500">{company}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Users className="h-5 w-5 text-indigo-500" />
            <div>
              <p className="text-xl font-bold text-slate-900">{applications.length}</p>
              <p className="text-xs text-slate-500">candidature{applications.length > 1 ? 's' : ''} reçue{applications.length > 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Kanban pipeline */}
        <KanbanBoard jobId={jobId} applications={applications} />
      </div>
    </main>
  );
}
