import Link from 'next/link';
import { cookies } from 'next/headers';
import { requireCurrentUser } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/api';
import { ResumeManager } from '@/components/resume-manager';
import type { Resume } from './actions';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import { ArrowLeft, FileText } from 'lucide-react';

async function getResumes(): Promise<Resume[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('jobpilot_token')?.value;

  if (!token) {
    return [];
  }

  const response = await fetch(`${API_BASE_URL}/api/resumes`, {
    headers: {
      Cookie: `jobpilot_token=${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as { resumes: Resume[] };
  return data.resumes;
}

export default async function ResumesPage() {
  const user = await requireCurrentUser();
  const resumes = await getResumes();

  return (
    <main className="min-h-screen bg-slate-50/60 p-4 sm:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <DashboardHeader user={user} />
        <DashboardNav />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Gestion des CVs & Variantes
              </h1>
              <p className="text-xs text-slate-500">
                Enregistrez vos différents CVs ciblés et définissez le document par défaut pour vos candidatures.
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

        <ResumeManager resumes={resumes} />
      </div>
    </main>
  );
}
