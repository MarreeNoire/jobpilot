'use client';

import { useActionState, useMemo, useState } from 'react';
import {
  type Application,
  type ApplicationFormState,
  createApplicationAction,
  updateApplicationStatusAction,
} from '@/app/dashboard/applications/actions';
import type { Job } from '@/app/dashboard/jobs/actions';
import type { Resume } from '@/app/dashboard/resumes/actions';
import { BriefcaseBusiness, CheckCircle2, ChevronDown, FilePlus2, Filter, Loader2, Send, Sparkles, X } from 'lucide-react';

interface ApplicationManagerProps {
  applications: Application[];
  jobs: Job[];
  resumes: Resume[];
}

const initialState: ApplicationFormState = {};
const applicationStatuses: readonly Application['status'][] = [
  'DRAFT',
  'PENDING',
  'PROCESSING',
  'WAITING_USER',
  'SUBMITTED',
  'REVIEWING',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'FAILED',
  'REJECTED',
  'INTERVIEW',
  'ACCEPTED',
];
const candidateEditableStatuses = ['DRAFT', 'PENDING', 'PROCESSING', 'WAITING_USER', 'SUBMITTED'] as const;

const statusLabels: Record<Application['status'], string> = {
  DRAFT: 'Brouillon',
  PENDING: 'En attente',
  PROCESSING: 'En cours',
  WAITING_USER: 'Action utilisateur',
  SUBMITTED: 'Soumise',
  REVIEWING: 'En cours d’examen',
  SHORTLISTED: 'Présélectionnée',
  INTERVIEW_SCHEDULED: 'Entretien planifié',
  FAILED: 'Échec',
  REJECTED: 'Refusée',
  INTERVIEW: 'Entretien',
  ACCEPTED: 'Acceptée',
};

export function ApplicationManager({ applications, jobs, resumes }: ApplicationManagerProps) {
  const [state, formAction, pending] = useActionState(createApplicationAction, initialState);
  const [showCreateForm, setShowCreateForm] = useState(jobs.length > 0 && applications.length === 0);
  const [statusFeedback, setStatusFeedback] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | Application['status']>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'AUTOMATIC' | 'MANUAL'>('ALL');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;
  const filteredApplications = useMemo(
    () => applications.filter((application) =>
      (statusFilter === 'ALL' || application.status === statusFilter) &&
      (sourceFilter === 'ALL' || application.source === sourceFilter)
    ),
    [applications, sourceFilter, statusFilter]
  );
  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / PAGE_SIZE));
  const paginatedApplications = filteredApplications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const statusSummary = useMemo(() => ({
    total: applications.length,
    active: applications.filter((application) => ['SUBMITTED', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW'].includes(application.status)).length,
    automatic: applications.filter((application) => application.source === 'AUTOMATIC').length,
    accepted: applications.filter((application) => application.status === 'ACCEPTED').length,
  }), [applications]);

  const handleStatusChange = async (
    applicationId: string,
    status: Application['status']
  ) => {
    setUpdatingId(applicationId);
    const result = await updateApplicationStatusAction(applicationId, status);

    setStatusFeedback((current) => ({
      ...current,
      [applicationId]: result.error ?? result.success ?? '',
    }));
    setUpdatingId(null);
  };

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total', value: statusSummary.total, icon: Send, tone: 'blue' },
          { label: 'En cours', value: statusSummary.active, icon: BriefcaseBusiness, tone: 'amber' },
          { label: 'Automatiques', value: statusSummary.automatic, icon: Sparkles, tone: 'violet' },
          { label: 'Acceptées', value: statusSummary.accepted, icon: CheckCircle2, tone: 'emerald' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              tone === 'blue' ? 'bg-blue-50 text-blue-600' :
              tone === 'amber' ? 'bg-amber-50 text-amber-600' :
              tone === 'violet' ? 'bg-violet-50 text-violet-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-slate-900">{value}</p>
              <p className="text-xs font-medium text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Votre pipeline</h1>
            <p className="mt-1 text-sm text-slate-500">Suivez chaque candidature, de l’idée à la réponse.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm((current) => !current)}
            disabled={jobs.length === 0}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {showCreateForm ? <X className="h-4 w-4" /> : <FilePlus2 className="h-4 w-4" />}
            {showCreateForm ? 'Fermer' : 'Nouveau brouillon'}
          </button>
        </div>

        {showCreateForm && (
          <form action={formAction} className="space-y-5 border-b border-slate-100 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FilePlus2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Préparer un brouillon</h2>
                <p className="mt-0.5 text-sm text-slate-500">Choisissez une offre et un CV. Vous pourrez compléter la candidature ensuite.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Offre</span>
            <select
              name="jobId"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Sélectionner une offre</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} — {job.company}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">CV (optionnel)</span>
            <select
              name="resumeId"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Aucun CV spécifique</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.title}
                  {resume.isPrimary ? ' (principal)' : ''}
                </option>
              ))}
            </select>
          </label>
            </div>

            {state.error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
            {state.success ? <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{state.success}</p> : null}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setShowCreateForm(false)} className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">Annuler</button>
              <button type="submit" disabled={pending || jobs.length === 0} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {pending ? 'Création...' : 'Enregistrer le brouillon'}
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Candidatures enregistrées</h2>
            <p className="mt-1 text-sm text-slate-500">{filteredApplications.length} résultat{filteredApplications.length === 1 ? '' : 's'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500"><Filter className="h-3.5 w-3.5" /> Filtrer</span>
            <label className="relative">
              <span className="sr-only">Filtrer par statut</span>
              <select value={statusFilter} onChange={(event) => { setPage(1); setStatusFilter(event.target.value as typeof statusFilter); }} className="min-h-10 appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                <option value="ALL">Tous les statuts</option>
                {applicationStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-3.5 w-3.5 text-slate-400" />
            </label>
            <label className="relative">
              <span className="sr-only">Filtrer par origine</span>
              <select value={sourceFilter} onChange={(event) => { setPage(1); setSourceFilter(event.target.value as typeof sourceFilter); }} className="min-h-10 appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                <option value="ALL">Toutes les sources</option>
                <option value="MANUAL">Manuelles</option>
                <option value="AUTOMATIC">Automatiques</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-3.5 w-3.5 text-slate-400" />
            </label>
          </div>
        </div>

        <div className="space-y-3 p-5 sm:p-6">
          {filteredApplications.length === 0 ? (
            <p className="text-sm text-slate-600">Aucune candidature enregistrée pour le moment.</p>
          ) : (
            paginatedApplications.map((application) => (
              <div key={application.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900">
                      {application.job?.title ?? 'Offre inconnue'}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {application.job?.company ?? 'Entreprise inconnue'}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>Plateforme : {application.job?.platform ?? 'n/a'}</span>
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${application.source === 'AUTOMATIC' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {application.source === 'AUTOMATIC' ? 'Automatique' : 'Manuelle'}
                      </span>
                      {application.compatibilityScore !== null && <span>{application.compatibilityScore}% match</span>}
                    </div>
                  </div>

                  <div className="min-w-52 space-y-2">
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {statusLabels[application.status]}
                    </span>
                    <select
                      defaultValue={application.status}
                      disabled={updatingId === application.id}
                      onChange={(event) => {
                        void handleStatusChange(
                          application.id,
                          event.target.value as Application['status']
                        );
                      }}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                    >
                      {candidateEditableStatuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                    {statusFeedback[application.id] ? (
                      <p className="text-xs text-slate-500">{statusFeedback[application.id]}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="docket">Page {page} sur {totalPages}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Précédent
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
