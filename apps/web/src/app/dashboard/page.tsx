import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { requireCurrentUser } from '@/lib/auth';
import { DashboardNav } from '@/components/dashboard-nav';
import { DashboardHeader } from '@/components/dashboard-header';
import { RecruiterDashboard } from '@/components/recruiter-dashboard';
import { fetchDashboardData, fetchRecruiterApplicationsOverview, fetchRecruiterJobs, getOnboardingState } from '@/lib/dashboard';
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  FileText,
  Lightbulb,
  PlusCircle,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  User,
} from 'lucide-react';

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const cookieStore = await cookies();
  const token = cookieStore.get('jobpilot_token')?.value;

  if (user.role === 'ADMIN') {
    return (
      <main className="min-h-screen bg-slate-50/60 p-4 sm:p-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <DashboardHeader user={user} />
          <DashboardNav role={user.role} />
          <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-6 text-center">
            <h2 className="font-serif text-xl font-semibold text-blue-900">Espace Administrateur</h2>
            <p className="mt-2 text-sm text-blue-800/70">Vous êtes connecté en tant qu'administrateur.</p>
            <a
              href="/dashboard/admin"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              Accéder au dashboard admin
            </a>
          </div>
        </div>
      </main>
    );
  }

  if (user.role === 'RECRUITER') {
    const [recruiterJobsResult, overview] = await Promise.all([
      fetchRecruiterJobs(token),
      fetchRecruiterApplicationsOverview(token),
    ]);

    return (
      <main className="min-h-screen bg-slate-50/60 p-4 sm:p-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <DashboardHeader user={user} />
          <DashboardNav role={user.role} />
          <RecruiterDashboard user={user} jobs={recruiterJobsResult.jobs} overview={overview} jobsError={recruiterJobsResult.error} />
        </div>
      </main>
    );
  }

  // CANDIDATE (default)
  const data = await fetchDashboardData(token);
  const onboarding = getOnboardingState(data);

  const hasPrimaryResume = data.resumes.some((resume) => resume.isPrimary);
  const latestJob = data.jobs[0] ?? null;

  return (
    <main className="min-h-screen bg-slate-50/60 p-4 sm:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <DashboardHeader user={user} />
        <DashboardNav role={user.role} />

        {/* Personalized Welcome Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-8 text-white shadow-lg shadow-blue-500/10">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/5 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                <span>Espace de pilotage intelligent</span>
              </div>
              <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                Bonjour {user.firstName} 👋
              </h1>
              <p className="mt-2 max-w-xl text-blue-50 text-sm sm:text-base leading-relaxed">
                Configurez votre profil et vos critères pour permettre à l'IA d'analyser vos offres et d'optimiser chacune de vos candidatures.
              </p>
            </div>

            {/* Progress Card */}
            <div className="w-full md:w-72 rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/15">
              {onboarding.isSetupComplete ? (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-100">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Configuration terminée</span>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    Votre espace JobPilot est prêt.
                  </p>
                  <p className="text-[11px] leading-relaxed text-blue-50">
                    Vous pouvez maintenant passer à la gestion active de vos offres et candidatures.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>Préparation du profil</span>
                    <span className="text-yellow-400">{onboarding.progressPercent}%</span>
                  </div>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-emerald-400 transition-all duration-1000 ease-in-out"
                      style={{ width: `${onboarding.progressPercent}%` }}
                    >
                      {/* Ajouter des markers pour chaque étape */}
                      {onboarding.steps.map((step, index) => (
                        <div key={index} className="absolute left-[calc(${step.completed ? (onboarding.progressPercent * 100 / onboarding.totalCount) : 0}%) -1px] top-[-2px] h-[4px] w-[2px] bg-white rounded" />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-blue-50">
                    {onboarding.completedCount} sur {onboarding.totalCount} étapes complétées
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Key KPI Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Offres suivies</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Briefcase className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">{data.jobs.length}</p>
            <p className="mt-1 text-xs text-slate-500">
              {data.jobs.length > 0 ? 'Offres dans votre pipeline' : '🔍 Commencez par ajouter votre première offre'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">CVs enregistrés</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">{data.resumes.length}</p>
            <p className="mt-1 text-xs text-slate-500">
              {hasPrimaryResume ? '✓ CV principal actif' : '📄 Importez votre premier CV pour commencer'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Critères cibles</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-base font-bold text-slate-900">
              {data.preference ? 'Configurés' : 'À définir'}
            </p>
            <p className="mt-1 text-xs text-slate-500 truncate">
              {data.preference?.jobTitles?.[0] ?? 'Postes non spécifiés'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Statut profil</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <User className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-base font-bold text-slate-900">
              {data.profile?.title ? data.profile.title : 'Non renseigné'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {data.profile?.yearsOfExperience ? `${data.profile.yearsOfExperience} an(s) d'exp.` : 'Expérience à préciser'}
            </p>
          </div>
        </section>

        {/* Setup roadmap / summary */}
        {onboarding.isSetupComplete ? (
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-serif text-xl font-semibold tracking-tight text-slate-900">
                  Résumé de votre configuration
                </h2>
                <p className="text-xs text-slate-500">
                  Les éléments essentiels sont en place. Vous pouvez toujours les ajuster à tout moment.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">Profil</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-3 text-sm text-slate-700">
                  {data.profile?.title || 'Profil configuré'}
                </p>
                <Link href="/dashboard/profile" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200">
                  Modifier <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:-translate-x-0.5" />
                </Link>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">Préférences</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-3 text-sm text-slate-700">
                  {data.preference?.jobTitles?.[0] || 'Critères enregistrés'}
                </p>
                <Link href="/dashboard/preferences" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200">
                  Ajuster <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:-translate-x-0.5" />
                </Link>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">CVs</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-3 text-sm text-slate-700">
                  {data.resumes.length} document{data.resumes.length > 1 ? 's' : ''} disponible{data.resumes.length > 1 ? 's' : ''}
                </p>
                <Link href="/dashboard/resumes" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200">
                  Gérer <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:-translate-x-0.5" />
                </Link>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">Offres</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-3 text-sm text-slate-700">
                  {data.jobs.length} offre{data.jobs.length > 1 ? 's' : ''} enregistrée{data.jobs.length > 1 ? 's' : ''}
                </p>
                <Link href="/dashboard/jobs" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                  Ouvrir <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-serif text-xl font-semibold tracking-tight text-slate-900">
                  Parcours d’optimisation recommandé
                </h2>
                <p className="text-xs text-slate-500">
                  Suivez ces étapes dans l’ordre pour maximiser l’efficacité de vos candidatures assistées par IA.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className={`relative flex flex-col justify-between rounded-2xl border p-5 transition ${
                onboarding.steps[0]?.completed ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50/50'
              }`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="stamp stamp-green">Étape 1</span>
                    {onboarding.steps[0]?.completed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" /> Renseigné
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                        <CircleDashed className="h-4 w-4" /> À faire
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 font-semibold text-slate-900">Profil Professionnel</h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    Titre, niveau d'expérience, disponibilité et résumé qui serviront de socle aux candidatures.
                  </p>
                </div>
                <div className="mt-4 border-t border-slate-200/60 pt-3">
                  <Link href="/dashboard/profile" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                    <span>{onboarding.steps[0]?.completed ? 'Modifier le profil' : 'Compléter mon profil'}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              <div className={`relative flex flex-col justify-between rounded-2xl border p-5 transition ${
                onboarding.steps[1]?.completed ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50/50'
              }`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="stamp stamp-teal">Étape 2</span>
                    {onboarding.steps[1]?.completed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" /> Défini
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                        <CircleDashed className="h-4 w-4" /> À faire
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 font-semibold text-slate-900">Préférences & Critères</h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    Postes visés, localisations souhaitées, télétravail, rémunération minimale et secteurs.
                  </p>
                </div>
                <div className="mt-4 border-t border-slate-200/60 pt-3">
                  <Link href="/dashboard/preferences" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                    <span>{onboarding.steps[1]?.completed ? 'Ajuster les critères' : 'Définir mes critères'}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              <div className={`relative flex flex-col justify-between rounded-2xl border p-5 transition ${
                onboarding.steps[2]?.completed ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50/50'
              }`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="stamp stamp-pine">Étape 3</span>
                    {onboarding.steps[2]?.completed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" /> {data.resumes.length} CV(s)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                        <CircleDashed className="h-4 w-4" /> À faire
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 font-semibold text-slate-900">CVs & Documents</h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    Importez ou liez vos différentes variantes de CV pour adapter chaque candidature.
                  </p>
                </div>
                <div className="mt-4 border-t border-slate-200/60 pt-3">
                  <Link href="/dashboard/resumes" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                    <span>{onboarding.steps[2]?.completed ? 'Mettre à jour mes CVs' : 'Ajouter un CV'}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              <div className={`relative flex flex-col justify-between rounded-2xl border p-5 transition ${
                onboarding.steps[3]?.completed ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50/50'
              }`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="stamp stamp-amber">Étape 4</span>
                    {onboarding.steps[3]?.completed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" /> {data.jobs.length} Offre(s)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                        <CircleDashed className="h-4 w-4" /> À faire
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 font-semibold text-slate-900">Suivi des Candidatures</h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    Ajoutez manuellement vos offres ou détectez-les en temps réel via l'extension Chrome.
                  </p>
                </div>
                <div className="mt-4 border-t border-slate-200/60 pt-3">
                  <Link href="/dashboard/jobs" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                    <span>{onboarding.steps[3]?.completed ? 'Gérer les offres' : 'Ajouter une offre'}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {onboarding.isSetupComplete ? (
          <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Setup complete</span>
                  </div>
                  <h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-slate-900">
                    Votre espace est prêt
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-700">
                    Les 4 étapes de préparation sont complétées. Vous pouvez maintenant passer à la phase opérationnelle : analyser vos offres, préparer vos candidatures et enrichir progressivement votre pipeline.
                  </p>
                </div>
                <TrendingUp className="mt-1 h-8 w-8 shrink-0 text-emerald-600" />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Link href="/dashboard/jobs" className="rounded-2xl border border-emerald-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 transition hover:border-emerald-300 hover:shadow-sm">
                  <span className="block">Analyser une offre</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600">
                    Ouvrir les offres <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
                <Link href="/dashboard/applications" className="rounded-2xl border border-emerald-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 transition hover:border-emerald-300 hover:shadow-sm">
                  <span className="block">Créer une candidature</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600">
                    Ouvrir le suivi <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
                <Link href="/dashboard/resumes" className="rounded-2xl border border-emerald-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 transition hover:border-emerald-300 hover:shadow-sm">
                  <span className="block">Préparer les documents</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600">
                    Gérer les CVs <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
                <Link href="/dashboard/profile" className="rounded-2xl border border-emerald-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 transition hover:border-emerald-300 hover:shadow-sm">
                  <span className="block">Affiner le profil</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600">
                    Optimiser le matching <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">Prochaine action conseillée</h3>
              {latestJob ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Offre la plus récente
                    </p>
                    <h4 className="mt-2 font-semibold text-slate-900">{latestJob.title}</h4>
                    <p className="text-sm text-slate-600">{latestJob.company}</p>
                    <p className="mt-1 text-xs text-slate-500">{latestJob.platform}</p>
                  </div>
                  <Link href="/dashboard/jobs" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
                    Voir les offres et continuer <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-600">
                  Ajoutez une nouvelle offre pour commencer la phase d’analyse et de suivi.
                </p>
              )}
            </div>
          </section>
        ) : null}

        {/* AI Copilot & Quick Advice banner */}
        <section className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-blue-950">
                Astuce JobPilot IA : Optimisation de votre visibilité
              </h3>
              <p className="text-xs text-blue-900/80 leading-relaxed">
                Plus votre résumé professionnel et vos critères sont précis, plus le score d'adéquation calculé lors de la détection d'offres sera fiable. Pensez également à installer l'extension Chrome pour importer vos offres en un clic sans saisie manuelle.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
