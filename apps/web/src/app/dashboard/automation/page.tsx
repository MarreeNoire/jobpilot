import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/lib/auth';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import { AutomationManager } from '@/components/automation-manager';
import { getAutomationRulesAction } from './actions';
import { getCoverLettersAction } from '../cover-letters/actions';
import { API_BASE_URL } from '@/lib/api';
import { cookies } from 'next/headers';
import type { Resume } from '../resumes/actions';
import { Zap } from 'lucide-react';

async function getResumes(token: string): Promise<Resume[]> {
  const res = await fetch(`${API_BASE_URL}/api/resumes`, {
    headers: { Cookie: `jobpilot_token=${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return ((await res.json()) as { resumes: Resume[] }).resumes ?? [];
}

export default async function AutomationPage() {
  const user = await requireCurrentUser();
  if (user.role !== 'CANDIDATE') redirect('/dashboard');

  const cookieStore = await cookies();
  const token = cookieStore.get('jobpilot_token')?.value ?? '';

  const [rules, resumes, coverLetters] = await Promise.all([
    getAutomationRulesAction(),
    getResumes(token),
    getCoverLettersAction(),
  ]);

  return (
    <main className="min-h-screen bg-slate-50/60 p-4 sm:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <DashboardHeader user={user} />
        <DashboardNav role={user.role} />

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Automatisation</h1>
            <p className="text-xs text-slate-500">
              Configurez des règles pour que JobPilot postule automatiquement aux offres qui correspondent à vos critères.
            </p>
          </div>
        </div>

        {/* Explication du mode pilote automatique */}
        <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
          <p className="text-sm font-semibold text-amber-800">⚡ Comment fonctionne le mode automatique ?</p>
          <p className="mt-1.5 text-xs text-amber-700 leading-relaxed">
            Créez une règle (ex. "CDI + Informatique + Abidjan + score ≥ 75%").
            À chaque synchronisation d'offres, le système vérifie vos règles et peut postuler automatiquement à votre place —
            avec votre CV et votre lettre de motivation pré-sélectionnés.
            Vous recevez un email récapitulatif de chaque candidature envoyée.
          </p>
        </section>

        <AutomationManager rules={rules} resumes={resumes} coverLetters={coverLetters} />
      </div>
    </main>
  );
}
