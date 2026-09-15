import Link from 'next/link';
import { cookies } from 'next/headers';
import { requireCurrentUser } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/api';
import { JobPreferencesForm } from '@/components/job-preferences-form';
import {
  saveJobPreferencesAction,
  type JobPreference,
} from './actions';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';

async function getJobPreference(): Promise<JobPreference | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('jobpilot_token')?.value;

  if (!token) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/api/job-preferences`, {
    headers: {
      Cookie: `jobpilot_token=${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { preference: JobPreference | null };
  return data.preference;
}

export default async function PreferencesPage() {
  const user = await requireCurrentUser();
  const preference = await getJobPreference();

  return (
    <main className="min-h-screen bg-slate-50/60 p-4 sm:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <DashboardHeader user={user} />
        <DashboardNav role={user.role} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">
                Critères & Préférences de Recherche
              </h1>
              <p className="text-xs text-slate-500">
                Définissez les postes, salaires, conditions de contrat et modes de travail ciblés.
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

        <JobPreferencesForm
          preference={preference}
          action={saveJobPreferencesAction}
        />
      </div>
    </main>
  );
}
