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

async function getJobs(role: UserRole): Promise<Job[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('jobpilot_token')?.value;

  if (!token) {
    return [];
  }

  const endpoint = role === 'RECRUITER' ? '/api/jobs/mine' : '/api/jobs';

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      Cookie: `jobpilot_token=${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as { jobs: Job[] };
  return data.jobs;
}

export default async function JobsPage() {
  const user = await requireCurrentUser();
  const cookieStore = await cookies();
  const token = cookieStore.get('jobpilot_token')?.value ?? '';

  const [jobs, preferences] = await Promise.all([
    getJobs(user.role),
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

        <JobManager jobs={jobs} userRole={user.role} preferences={preferences} />
      </div>
    </main>
  );
}
