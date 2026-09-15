import Link from 'next/link';
import type { PublicUser } from '@/lib/api';
import type { PipelineStatus, RecruiterApplicationsOverview, RecruiterJob } from '@/lib/dashboard';
import {
  ArrowRight,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  Clock,
  PlusCircle,
  Sparkles,
  TriangleAlert,
  Users,
  XCircle,
} from 'lucide-react';

interface RecruiterDashboardProps {
  user: PublicUser;
  jobs: RecruiterJob[];
  overview: RecruiterApplicationsOverview;
  jobsError?: string;
}

const pipelineConfig: Record<PipelineStatus, { label: string; badge: string; dot: string }> = {
  PENDING: { label: 'Reçues', badge: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
  REVIEWING: { label: 'En examen', badge: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  SHORTLISTED: { label: 'Présélectionnées', badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  INTERVIEW_SCHEDULED: { label: 'Entretien planifié', badge: 'bg-indigo-50 text-indigo-700', dot: 'bg-indigo-500' },
  ACCEPTED: { label: 'Acceptées', badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  REJECTED: { label: 'Refusées', badge: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
};

const pipelineOrder: PipelineStatus[] = [
  'PENDING',
  'REVIEWING',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'ACCEPTED',
  'REJECTED',
];

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "à l'instant";
  if (diffHours < 24) return `il y a ${diffHours} h`;
  const diffDays = Math.round(diffHours / 24);
  return `il y a ${diffDays} j`;
}

export function RecruiterDashboard({ user, jobs, overview, jobsError }: RecruiterDashboardProps) {
  const totalApplications = overview.totalApplications;
  const counts = overview.statusCounts;
  const awaitingAction = (counts.PENDING ?? 0) + (counts.REVIEWING ?? 0);
  const interviewsPlanned = counts.INTERVIEW_SCHEDULED ?? 0;
  const hired = counts.ACCEPTED ?? 0;
  const publishedJobs = jobs.filter((job) => job.status === 'PUBLISHED');
  const mostRecentJobs = publishedJobs.slice(0, 5);

  return (
    <>
      {/* Personalized Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-blue-700 to-slate-900 p-8 text-white shadow-lg shadow-indigo-500/10">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              <span>Espace de gestion du recrutement</span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Bonjour {user.firstName} 👋
            </h1>
            <p className="mt-2 max-w-xl text-blue-100 text-sm sm:text-base leading-relaxed">
              Publiez vos offres, suivez votre pipeline de candidatures et validez vos recrutements.
            </p>
          </div>

          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Publier une offre</span>
          </Link>
        </div>
      </section>

      {(overview.error || jobsError) && (
        <section role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Certaines donnees recruteur sont indisponibles</p>
            <p className="mt-1 text-xs">{overview.error ?? jobsError}</p>
            <Link href="/dashboard" className="mt-2 inline-flex text-xs font-semibold text-red-700 underline hover:text-red-900">Reessayer</Link>
          </div>
        </section>
      )}

      {/* Priority actions keep the dashboard focused on the next recruiting decision. */}
      <section className="rounded-3xl border border-blue-100 bg-blue-50/60 p-5 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Priorites du jour</h2>
            <p className="text-xs text-slate-600">Accedez directement aux actions qui necessitent votre attention.</p>
          </div>
          <Link href="/dashboard/applications" className="text-xs font-semibold text-blue-700 hover:text-blue-900">Ouvrir tout le pipeline <ArrowRight className="ml-1 inline h-3 w-3" /></Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link href="/dashboard/applications?status=PENDING" className="rounded-2xl border border-white bg-white p-4 transition hover:border-blue-300 hover:shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">A examiner</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{counts.PENDING ?? 0}</p>
            <p className="mt-1 text-xs text-slate-500">Nouvelles candidatures a trier</p>
          </Link>
          <Link href="/dashboard/applications?status=REVIEWING" className="rounded-2xl border border-white bg-white p-4 transition hover:border-blue-300 hover:shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">A decider</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{counts.REVIEWING ?? 0}</p>
            <p className="mt-1 text-xs text-slate-500">Dossiers en examen</p>
          </Link>
          <Link href="/dashboard/applications?status=INTERVIEW_SCHEDULED" className="rounded-2xl border border-white bg-white p-4 transition hover:border-blue-300 hover:shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">A preparer</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{interviewsPlanned}</p>
            <p className="mt-1 text-xs text-slate-500">Entretiens planifies</p>
          </Link>
        </div>
      </section>

      {/* KPI Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/jobs" className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Offres publiees</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Briefcase className="h-4 w-4" /></div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{publishedJobs.length}</p>
          <p className="mt-1 text-xs text-slate-500">{publishedJobs.length > 0 ? 'Offres actuellement en ligne' : 'Aucune offre publiee pour le moment'}</p>
        </Link>

        <Link href="/dashboard/applications" className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">A traiter</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Clock className="h-4 w-4" /></div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{awaitingAction}</p>
          <p className="mt-1 text-xs text-slate-500">{awaitingAction > 0 ? 'Candidatures recues ou en examen' : 'Aucune candidature en attente'}</p>
        </Link>

        <Link href="/dashboard/applications?status=INTERVIEW_SCHEDULED" className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Entretiens planifies</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><CalendarCheck className="h-4 w-4" /></div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{interviewsPlanned}</p>
          <p className="mt-1 text-xs text-slate-500">{interviewsPlanned > 0 ? 'Candidats convoques' : 'Aucun entretien planifie'}</p>
        </Link>

        <Link href="/dashboard/applications?status=ACCEPTED" className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recrutements valides</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-4 w-4" /></div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{hired}</p>
          <p className="mt-1 text-xs text-slate-500">{hired > 0 ? 'Candidatures acceptees' : 'Aucun recrutement finalise'}</p>
        </Link>
      </section>

      {/* Pipeline global */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Pipeline de recrutement</h2>
            <p className="text-xs text-slate-500">
              Répartition de vos {totalApplications} candidature{totalApplications > 1 ? 's' : ''} par statut, toutes offres confondues.
            </p>
          </div>
          <Users className="h-5 w-5 text-slate-300" />
        </div>

        {totalApplications === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
            <p className="text-sm font-semibold text-slate-700">Aucune candidature pour le moment</p>
            <p className="mt-1 text-xs text-slate-500">
              Publiez une offre pour commencer à recevoir des candidatures et suivre votre pipeline ici.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {pipelineOrder.map((status) => {
              const count = counts[status] ?? 0;
              const percent = totalApplications > 0 ? Math.round((count / totalApplications) * 100) : 0;
              const { label, badge, dot } = pipelineConfig[status];

              return (
                <div key={status} className="rounded-2xl border border-slate-200 p-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                    {label}
                  </span>
                  <p className="mt-3 text-2xl font-bold text-slate-900">{count}</p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${dot}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Recent jobs */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Vos offres récentes</h2>
              <p className="text-xs text-slate-500">Accédez directement au pipeline de chaque offre.</p>
            </div>
            <Link href="/dashboard/jobs" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
              Voir toutes mes offres <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {mostRecentJobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Briefcase className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900">Aucune offre publiée pour le moment</h3>
              <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto">
                Publiez votre première offre pour commencer à recevoir des candidatures sur la plateforme.
              </p>
              <Link
                href="/dashboard/jobs"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Publier une offre</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {mostRecentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/dashboard/jobs/${job.id}/applications`}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900">{job.title}</p>
                    <p className="text-xs text-slate-500">{job.company}{job.location ? ` · ${job.location}` : ''}</p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <Users className="h-3.5 w-3.5" />
                    {job.applicationsCount} candidature{job.applicationsCount > 1 ? 's' : ''}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent applications across the pipeline */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Candidatures récentes</h2>
            <p className="text-xs text-slate-500">Dernières évolutions de votre pipeline.</p>
          </div>

          {overview.recent.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
              <p className="text-sm text-slate-500">Aucune candidature récente à afficher.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overview.recent.map((application) => {
                const config = pipelineConfig[application.status] ?? {
                  label: application.status,
                  badge: 'bg-slate-100 text-slate-700',
                  dot: 'bg-slate-400',
                };
                const isRejected = application.status === 'REJECTED';

                return (
                  <Link
                    key={application.id}
                    href={`/dashboard/jobs/${application.jobId}/applications/${application.id}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3.5 transition hover:border-blue-200 hover:bg-blue-50/30"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{application.candidateName}</p>
                      <p className="truncate text-xs text-slate-500">
                        {application.jobTitle} · {application.company}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.badge}`}>
                        {isRejected ? <XCircle className="h-3 w-3" /> : <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />}
                        {config.label}
                      </span>
                      <span className="text-[10px] text-slate-400">{timeAgo(application.updatedAt)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
