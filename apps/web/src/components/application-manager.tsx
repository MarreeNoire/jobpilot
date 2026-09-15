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
import {
  Briefcase,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FilePlus2,
  Filter,
  Loader2,
  PartyPopper,
  Search,
  Send,
  Sparkles,
  Undo2,
  X,
} from 'lucide-react';

interface ApplicationManagerProps {
  applications: Application[];
  jobs: Job[];
  resumes: Resume[];
}

const initialState: ApplicationFormState = {};

const statusLabels: Record<Application['status'], string> = {
  DRAFT: 'Brouillon',
  PENDING: 'En attente',
  PROCESSING: 'En cours',
  WAITING_USER: 'Action requise',
  SUBMITTED: 'Soumise',
  REVIEWING: 'En examen par le recruteur',
  SHORTLISTED: 'Présélectionnée',
  INTERVIEW_SCHEDULED: 'Entretien planifié',
  FAILED: 'Non aboutie',
  REJECTED: 'Non retenue',
  INTERVIEW: 'Entretien en cours',
  ACCEPTED: 'Candidature acceptée 🎉',
};

const statusBadgeStyles: Record<Application['status'], string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  PENDING: 'bg-blue-50 text-blue-700 border-blue-200',
  PROCESSING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  WAITING_USER: 'bg-purple-50 text-purple-700 border-purple-200',
  SUBMITTED: 'bg-sky-50 text-sky-700 border-sky-200',
  REVIEWING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  SHORTLISTED: 'bg-amber-50 text-amber-800 border-amber-200',
  INTERVIEW_SCHEDULED: 'bg-violet-50 text-violet-700 border-violet-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  INTERVIEW: 'bg-violet-50 text-violet-700 border-violet-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
};

const WITHDRAWABLE_STATUSES = new Set<Application['status']>([
  'SUBMITTED',
  'REVIEWING',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
]);

export function ApplicationManager({ applications, jobs, resumes }: ApplicationManagerProps) {
  const [state, formAction, pending] = useActionState(createApplicationAction, initialState);
  const [showCreateForm, setShowCreateForm] = useState(jobs.length > 0 && applications.length === 0);
  const [statusFeedback, setStatusFeedback] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmingWithdrawId, setConfirmingWithdrawId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | Application['status']>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'AUTOMATIC' | 'MANUAL'>('ALL');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const filteredApplications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return applications.filter((application) => {
      const matchesStatus = statusFilter === 'ALL' || application.status === statusFilter;
      const matchesSource = sourceFilter === 'ALL' || application.source === sourceFilter;
      const title = application.job?.title?.toLowerCase() ?? '';
      const company = application.job?.company?.toLowerCase() ?? '';
      const platform = application.job?.platform?.toLowerCase() ?? '';
      const matchesSearch =
        !query || title.includes(query) || company.includes(query) || platform.includes(query);
      return matchesStatus && matchesSource && matchesSearch;
    });
  }, [applications, searchQuery, sourceFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / PAGE_SIZE));
  const paginatedApplications = filteredApplications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusSummary = useMemo(
    () => ({
      total: applications.length,
      active: applications.filter((app) =>
        ['SUBMITTED', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW'].includes(app.status)
      ).length,
      automatic: applications.filter((app) => app.source === 'AUTOMATIC').length,
      accepted: applications.filter((app) => app.status === 'ACCEPTED').length,
    }),
    [applications]
  );

  const handleStatusChange = async (applicationId: string, status: Application['status']) => {
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
      {/* Overview Stat Cards */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total candidatures', value: statusSummary.total, icon: Send, tone: 'blue' },
          { label: 'En cours d’examen', value: statusSummary.active, icon: BriefcaseBusiness, tone: 'amber' },
          { label: 'Candidatures auto', value: statusSummary.automatic, icon: Sparkles, tone: 'violet' },
          { label: 'Offres acceptées', value: statusSummary.accepted, icon: CheckCircle2, tone: 'emerald' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                tone === 'blue'
                  ? 'bg-blue-50 text-blue-600'
                  : tone === 'amber'
                  ? 'bg-amber-50 text-amber-600'
                  : tone === 'violet'
                  ? 'bg-violet-50 text-violet-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-slate-900">{value}</p>
              <p className="text-xs font-medium text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Main Section */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Suivi de vos candidatures</h1>
            <p className="mt-1 text-sm text-slate-500">
              Pilotez le statut de chaque postulation et soumettez vos nouveaux brouillons.
            </p>
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

        {/* Create Draft Form */}
        {showCreateForm && (
          <form action={formAction} className="space-y-5 border-b border-slate-100 p-5 sm:p-6 bg-blue-50/20">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <FilePlus2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Préparer une candidature</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Sélectionnez une offre et votre variante de CV. La candidature sera enregistrée dans votre suivi.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">Offre *</span>
                <select
                  name="jobId"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

            {state.error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {state.error}
              </p>
            ) : null}
            {state.success ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
                {state.success}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={pending || jobs.length === 0}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {pending ? 'Création...' : 'Enregistrer le brouillon'}
              </button>
            </div>
          </form>
        )}

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setPage(1);
                setSearchQuery(e.target.value);
              }}
              placeholder="Rechercher par poste, entreprise ou plateforme..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
              <Filter className="h-3.5 w-3.5" /> Filtrer :
            </span>
            <label className="relative">
              <span className="sr-only">Filtrer par statut</span>
              <select
                value={statusFilter}
                onChange={(event) => {
                  setPage(1);
                  setStatusFilter(event.target.value as typeof statusFilter);
                }}
                className="min-h-9 appearance-none rounded-xl border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="DRAFT">Brouillons</option>
                <option value="SUBMITTED">Soumises</option>
                <option value="REVIEWING">En cours d’examen</option>
                <option value="SHORTLISTED">Présélectionnées</option>
                <option value="INTERVIEW_SCHEDULED">Entretiens</option>
                <option value="ACCEPTED">Acceptées 🎉</option>
                <option value="REJECTED">Refusées</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </label>

            <label className="relative">
              <span className="sr-only">Filtrer par origine</span>
              <select
                value={sourceFilter}
                onChange={(event) => {
                  setPage(1);
                  setSourceFilter(event.target.value as typeof sourceFilter);
                }}
                className="min-h-9 appearance-none rounded-xl border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">Toutes les sources</option>
                <option value="MANUAL">Manuelles</option>
                <option value="AUTOMATIC">Automatiques</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </label>
          </div>
        </div>

        {/* List of Applications */}
        <div className="space-y-3 p-5 sm:p-6">
          {filteredApplications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
              <Briefcase className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-700">Aucune candidature trouvée</p>
              <p className="mt-1 text-xs text-slate-500">
                Ajustez vos filtres ou ajoutez un nouveau brouillon de candidature.
              </p>
            </div>
          ) : (
            paginatedApplications.map((application) => {
              const isDraft = application.status === 'DRAFT';
              const isAccepted = application.status === 'ACCEPTED';

              return (
                <div
                  key={application.id}
                  className={`rounded-2xl border p-4 transition ${
                    isAccepted
                      ? 'border-emerald-200 bg-emerald-50/40 shadow-sm'
                      : isDraft
                      ? 'border-slate-200 bg-slate-50/50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Job Details */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">{application.job?.title ?? 'Offre inconnue'}</h3>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                            statusBadgeStyles[application.status] ?? 'bg-slate-100 text-slate-900'
                          }`}
                        >
                          {statusLabels[application.status] ?? application.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm font-medium text-slate-900">
                        {application.job?.company ?? 'Entreprise inconnue'}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>Plateforme : {application.job?.platform ?? 'JobPilot'}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-semibold ${
                            application.source === 'AUTOMATIC'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {application.source === 'AUTOMATIC' ? 'Automatique' : 'Manuelle'}
                        </span>
                        {application.compatibilityScore !== null && (
                          <span className="font-semibold text-emerald-700">
                            {application.compatibilityScore}% adéquation
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contextual Action Button */}
                    <div className="flex items-center gap-2">
                      {isDraft ? (
                        <button
                          type="button"
                          disabled={updatingId === application.id}
                          onClick={() => void handleStatusChange(application.id, 'SUBMITTED')}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {updatingId === application.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          <span>Soumettre la candidature</span>
                        </button>
                      ) : isAccepted ? (
                        <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
                          <PartyPopper className="h-4 w-4 text-emerald-600" />
                          <span>Offre acceptée</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {application.job?.url && (
                            <a
                              href={application.job.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 shadow-sm"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>Voir l'offre</span>
                            </a>
                          )}
                          {WITHDRAWABLE_STATUSES.has(application.status) &&
                            (confirmingWithdrawId === application.id ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-slate-500">Confirmer ?</span>
                                <button
                                  type="button"
                                  disabled={updatingId === application.id}
                                  onClick={() => {
                                    setConfirmingWithdrawId(null);
                                    void handleStatusChange(application.id, 'REJECTED');
                                  }}
                                  className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
                                >
                                  {updatingId === application.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    'Oui, retirer'
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmingWithdrawId(null)}
                                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-50"
                                >
                                  Non
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmingWithdrawId(application.id)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 shadow-sm"
                              >
                                <Undo2 className="h-3.5 w-3.5" />
                                <span>Retirer ma candidature</span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hiring message for accepted applications */}
                  {isAccepted && application.hiringMessage && (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        Message du recruteur
                      </p>
                      <p className="mt-1 text-sm text-emerald-900">{application.hiringMessage}</p>
                    </div>
                  )}

                  {/* Feedback or Hiring Message */}
                  {statusFeedback[application.id] && (
                    <p className="mt-2 text-xs font-semibold text-emerald-600">{statusFeedback[application.id]}</p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="docket">
              Page {page} sur {totalPages} ({filteredApplications.length} candidatures)
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Précédent
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
