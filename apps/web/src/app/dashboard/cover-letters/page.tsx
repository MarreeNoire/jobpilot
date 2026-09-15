import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/lib/auth';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import { CoverLetterManager } from '@/components/cover-letter-manager';
import { getCoverLettersAction } from './actions';
import { FileText } from 'lucide-react';

export default async function CoverLettersPage() {
  const user = await requireCurrentUser();
  if (user.role !== 'CANDIDATE') redirect('/dashboard');

  const coverLetters = await getCoverLettersAction();

  return (
    <main className="min-h-screen bg-slate-50/60 p-4 sm:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <DashboardHeader user={user} />
        <DashboardNav role={user.role} />

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lettres de motivation</h1>
            <p className="text-xs text-slate-500">
              Rédigez, sauvegardez et gérez vos lettres. Elles seront proposées lors de chaque candidature.
            </p>
          </div>
        </div>

        <CoverLetterManager coverLetters={coverLetters} />
      </div>
    </main>
  );
}
