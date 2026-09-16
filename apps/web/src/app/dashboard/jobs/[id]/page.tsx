import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Briefcase, Building2, CalendarDays, MapPin, Send } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { requireCurrentUser } from '@/lib/auth';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import type { Job } from '../actions';

async function getJob(id: string, token: string): Promise<Job | null> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${id}`, {
    headers: {
      Cookie: `jobpilot_token=${token}`,
    },
    cache: 'no-store',
  });

  if (response.status === 404) return null;
  if (!response.ok) return null;

  const data = (await response.json()) as { job: Job };
  return data.job;
}

export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCurrentUser();

  if (user.role !== 'CANDIDATE') {
    redirect('/dashboard');
  }

  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('jobpilot_token')?.value;

  if (!token) {
    redirect('/login');
  }

  const job = await getJob(id, token);

  if (!job) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50/60 p-4 sm:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <DashboardHeader user={user} />
        <DashboardNav role={user.role} />

        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Retour aux offres</span>
          </Link>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{job.title}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2 font-medium text-slate-800">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    {job.company}
                  </span>
                  {job.location ? (
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {job.location}
                    </span>
                  ) : null}
                  {job.postedAt ? (
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-slate-400" />
                      Publiée le {new Date(job.postedAt).toLocaleDateString('fr-FR')}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <Link
              href={`/dashboard/jobs/${String(id)}/apply`}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
              <span>Postuler à cette offre</span>
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Entreprise</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{job.company}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Localisation</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{job.location ?? 'Non précisée'}</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Détails de l'offre</h2>
            <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {job.description ?? "Les détails complets de cette offre seront affichés ici dès qu'ils sont disponibles."}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
