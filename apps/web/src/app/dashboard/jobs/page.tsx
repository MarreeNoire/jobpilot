import Link from 'next/link';
import { cookies } from 'next/headers';
import { requireCurrentUser } from '@/lib/auth';
import { API_BASE_URL, type UserRole } from '@/lib/api';
import { JobManager } from '@/components/job-manager';
import type { Job } from './actions';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import type { CandidatePreferences } from '@/lib/matching';
import { ArrowLeft, Briefcase } from 'lucide-react';

async function getPreferences(token: string): Promise<CandidatePreferences | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/job-preferences`, {
      headers: { Cookie: `jobpilot_token=${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { preference: CandidatePreferences | null };
    return data.preference;
  } catch {
    return null;
  }
}

async function getCandidateSkills(token: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/profile`, {
      headers: { Cookie: `jobpilot_token=${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return [];
  } catch {
    return [];
  }
}

async function getJobs(role: UserRole, page: number): Promise<{ jobs: Job[]; totalPages: number; total: number }> {
  const cookieStore = await cookies();
  const token = cookieStore.get('jobpilot_token')?.value;

  if (!token) {
    return { jobs: [], totalPages: 1, total: 0 };
  }

  const endpoint = role === 'RECRUITER' ? '/api/jobs/mine' : '/api/jobs';

  const response = await fetch(`${API_BASE_URL}${endpoint}?page=${page}&limit=4`, {
    headers: {
      Cookie: `jobpilot_token=${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return { jobs: [], totalPages: 1, total: 0 };
  }

  const data = (await response.json()) as {
    jobs: Job[];
    pagination?: { totalPages: number; total: number };
  };
  return {
    jobs: data.jobs,
    totalPages: data.pagination?.totalPages ?? 1,
    total: data.pagination?.total ?? data.jobs.length,
  };
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireCurrentUser();
  const cookieStore = await cookies();
  const token = cookieStore.get('jobpilot_token')?.value ?? '';
  const resolvedParams = await searchParams;
  const currentPage = Math.max(1, parseInt(resolvedParams.page ?? '1') || 1);

  const [{ jobs, totalPages, total }, preferences] = await Promise.all([
    getJobs(user.role, currentPage),
    user.role === 'CANDIDATE' ? getPreferences(token) : null,
  ]);

  return (
    <main className="min-h-screen bg-slate-50/60 p-4 sm:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <DashboardHeader user={user} />
        <DashboardNav role={user.role} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {user.role === 'RECRUITER' ? 'Mes offres publiées' : "Offres d'emploi disponibles"}
              </h1>
              <p className="text-xs text-slate-500">
                {user.role === 'RECRUITER'
                  ? 'Gérez vos offres publiées et suivez le nombre de candidatures reçues.'
                  : 'Consultez les opportunités disponibles sur la plateforme et ouvrez leur fiche complète pour postuler.'}
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

        <JobManager jobs={jobs} userRole={user.role} preferences={preferences} total={total} />

        {totalPages > 1 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="docket">
              {total} offre{total > 1 ? 's' : ''} au total — page {currentPage} sur {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/jobs?page=${Math.max(1, currentPage - 1)}`}
                aria-disabled={currentPage <= 1}
                className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 ${
                  currentPage <= 1 ? 'pointer-events-none opacity-40' : ''
                }`}
              >
                Précédent
              </Link>
              <Link
                href={`/dashboard/jobs?page=${Math.min(totalPages, currentPage + 1)}`}
                aria-disabled={currentPage >= totalPages}
                className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 ${
                  currentPage >= totalPages ? 'pointer-events-none opacity-40' : ''
                }`}
              >
                Suivant
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
