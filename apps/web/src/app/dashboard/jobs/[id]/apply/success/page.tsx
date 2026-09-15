import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireCurrentUser } from '@/lib/auth';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import { CheckCircle2, Briefcase, Send } from 'lucide-react';

export default async function ApplySuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCurrentUser();
  if (user.role !== 'CANDIDATE') redirect('/dashboard');

  const { id: jobId } = await params;

  return (
    <main className="min-h-screen bg-slate-50/60 p-4 sm:p-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <DashboardHeader user={user} />
        <DashboardNav role={user.role} />

        <section className="flex flex-col items-center gap-6 rounded-3xl border border-emerald-200 bg-white p-10 shadow-sm text-center">
          {/* Icône de succès */}
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
              <Send className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Candidature envoyée ! 🎉
            </h1>
            <p className="max-w-md text-sm text-slate-600 leading-relaxed">
              Votre candidature a bien été transmise au recruteur. Vous recevrez un email de confirmation
              et serez notifié(e) à chaque évolution de votre dossier.
            </p>
          </div>

          {/* Étapes à venir */}
          <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Prochaines étapes</p>
            {[
              { step: '1', label: 'Le recruteur examine votre profil', sub: "Délai variable selon l'offre" },
              { step: '2', label: 'Vous recevez un email si votre candidature est présélectionnée', sub: 'Restez attentif(ve) à votre boîte mail' },
              { step: '3', label: 'Entretien planifié', sub: 'Le recruteur vous contactera pour fixer un rendez-vous' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  {item.step}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 w-full sm:flex-row sm:justify-center">
            <Link
              href="/dashboard/applications"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700"
            >
              Voir mes candidatures
            </Link>
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Briefcase className="h-4 w-4" />
              Explorer d'autres offres
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
