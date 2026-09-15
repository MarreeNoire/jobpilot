import Link from 'next/link';
import { cookies } from 'next/headers';
import { requireCurrentUser } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/api';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import { ApplicationManager } from '@/components/application-manager';
import { RecruiterApplicationsTable } from '@/components/recruiter-applications-table';
import { getRecruiterApplications } from '@/app/dashboard/jobs/[id]/applications/actions';
import { ArrowLeft, Briefcase, Send, TriangleAlert } from 'lucide-react';
import type { Application } from './actions';
import type { Job } from '../jobs/actions';
import type { Resume } from '../resumes/actions';

async function getCandidateData(token?: string): Promise<{
  applications: Application[];
  jobs: Job[];
  resumes: Resume[];
}> {
  if (!token) return { applications: [], jobs: [], resumes: [] };

  const headers = { Cookie: `jobpilot_token=${token}` };
  const [applicationsRes, jobsRes, resumesRes] = await Promise.all([
    fetch(`${API_BASE_URL}/api/applications`, { headers, cache: 'no-store' }),
    fetch(`${API_BASE_URL}/api/jobs`, { headers, cache: 'no-store' }),
    fetch(`${API_BASE_URL}/api/resumes`, { headers, cache: 'no-store' }),
  ]);

  const applications = applicationsRes.ok
    ? ((await applicationsRes.json()) as { applications: Application[] }).applications
    : [];
  const jobs = jobsRes.ok ? ((await jobsRes.json()) as { jobs: Job[] }).jobs : [];
  const resumes = resumesRes.ok ? ((await resumesRes.json()) as { resumes: Resume[] }).resumes : [];
  return { applications, jobs, resumes };
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string | string[] }>;
}) {
  const user = await requireCurrentUser();
  const cookieStore = await cookies();
  const token = cookieStore.get('jobpilot_token')?.value;

  if (user.role === 'RECRUITER') {
    const { applications, error } = await getRecruiterApplications();
    const recruiterSearchParams = searchParams ? await searchParams : {};
    const requestedStatus = Array.isArray(recruiterSearchParams.status)
      ? recruiterSearchParams.status[0]
      : recruiterSearchParams.status;
    return (
      <main className="min-h-screen bg-slate-50/60 p-4 sm:p-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <DashboardHeader user={user} />
          <DashboardNav role={user.role} />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Candidatures recues</h1>
                <p className="text-xs text-slate-500">Recherchez et priorisez les candidats sur toutes vos offres.</p>
              </div>
            </div>
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition hover:text-blue-600">
              <ArrowLeft className="h-3.5 w-3.5" /> Tableau de bord
            </Link>
          </div>
          {error ? (
            <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <div><p className="font-semibold">Les candidatures n&apos;ont pas pu etre chargees.</p><p className="mt-1 text-xs">{error}</p></div>
            </div>
          ) : null}
          <RecruiterApplicationsTable applications={applications} initialStatus={requestedStatus} />
        </div>
      </main>
    );
  }

  const { applications, jobs, resumes } = await getCandidateData(token);
  const appliedJobIds = new Set(applications.map((application) => application.jobId));

  return (
    <main className="min-h-screen bg-slate-50/60 p-4 sm:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <DashboardHeader user={user} />
        <DashboardNav role={user.role} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><Send className="h-5 w-5" /></div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Candidatures</h1>
              <p className="text-xs text-slate-500">Creez et suivez vos candidatures a partir des offres enregistrees.</p>
            </div>
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition hover:text-blue-600"><ArrowLeft className="h-3.5 w-3.5" /> Tableau de bord</Link>
        </div>
        <ApplicationManager applications={applications} jobs={jobs.filter((job) => !appliedJobIds.has(job.id))} resumes={resumes} />
      </div>
    </main>
  );
}
