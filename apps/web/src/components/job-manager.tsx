'use client';

import Link from 'next/link';
import { useActionState, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Job, JobFormState } from '@/app/dashboard/jobs/actions';
import { createJobAction, updateJobStatusAction, type JobStatus } from '@/app/dashboard/jobs/actions';
import type { UserRole } from '@/lib/api';
import { computeMatchScore, getScoreColor, getScoreLabel, type CandidatePreferences } from '@/lib/matching';
import {
  AlertCircle,
  AlignLeft,
  Banknote,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Filter,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Users,
  Pause,
  Play,
  XCircle,
} from 'lucide-react';

interface JobManagerProps {
  jobs: Job[];
  userRole: UserRole;
  preferences?: CandidatePreferences | null;
  total: number;
}

const initialState: JobFormState = {};

const platformPresets = [
  { id: 'linkedin', label: 'LinkedIn', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'indeed', label: 'Indeed', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'welcometothejungle', label: 'Welcome to the Jungle', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'glassdoor', label: 'Glassdoor', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'autre', label: 'Autre', color: 'bg-slate-100 text-slate-800 border-slate-200' },
];

export function JobManager({ jobs, userRole, preferences, total }: JobManagerProps) {
  const isRecruiter = userRole === 'RECRUITER';
  const router = useRouter();
  const [statusPending, startStatusTransition] = useTransition();
  const [statusError, setStatusError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(createJobAction, initialState);
  const [showAddForm, setShowAddForm] = useState(jobs.length === 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedPreset, setSelectedPreset] = useState('linkedin');
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  const toggleDescription = (id: string) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const jobsWithScores = useMemo(() => {
    return jobs.map((job) => ({
      ...job,
      score: isRecruiter ? null : computeMatchScore(
        { title: job.title, company: job.company, location: job.location, description: job.description },
        preferences ?? null
      ),
    }));
  }, [jobs, preferences, isRecruiter]);

  const filteredJobs = useMemo(() => {
    const filtered = jobsWithScores.filter((job) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPlatform =
        selectedPlatform === 'all' ||
        job.platform.toLowerCase() === selectedPlatform.toLowerCase();

      return matchesSearch && matchesPlatform;
    });

    // Trie par score décroissant pour les candidats
    if (!isRecruiter) {
      return [...filtered].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    }
    return filtered;
  }, [jobsWithScores, searchQuery, selectedPlatform, isRecruiter]);
  const matchingJobs = useMemo(
    () => jobsWithScores.filter((job) => !isRecruiter && job.score !== null && job.score >= 70).length,
    [jobsWithScores, isRecruiter]
  );
  const remoteJobs = useMemo(
    () => jobs.filter((job) => /remote|télétravail|teletravail/i.test(job.location ?? '')),
    [jobs]
  );

  const activeRecruiterJobs = useMemo(
    () => jobs.filter((job) => job.status === 'PUBLISHED'),
    [jobs]
  );

  function changeJobStatus(jobId: string, status: JobStatus) {
    if (status === 'CLOSED' && !window.confirm('Fermer cette offre ? Elle ne sera plus visible par les candidats.')) {
      return;
    }

    setStatusError(null);
    startStatusTransition(async () => {
      const result = await updateJobStatusAction(jobId, status);
      if (result.error) {
        setStatusError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const statusLabels: Record<JobStatus, string> = {
    DRAFT: 'Brouillon',
    PUBLISHED: 'Publiee',
    PAUSED: 'En pause',
    CLOSED: 'Fermee',
  };

  const getPlatformBadge = (platform: string) => {
    const p = platform.toLowerCase();
    const preset = platformPresets.find((item) => item.id === p);
    if (preset) {
      return (
        <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${preset.color}`}>
          {preset.label}
        </span>
      );
    }
    return (
      <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 uppercase">
        {platform}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: isRecruiter ? 'Offres publiées' : 'Opportunités', value: isRecruiter ? activeRecruiterJobs.length : total, tone: 'blue' },
          { label: isRecruiter ? 'Candidatures reçues' : 'Correspondances fortes', value: isRecruiter ? activeRecruiterJobs.reduce((sum, job) => sum + (job.applicationsCount ?? 0), 0) : matchingJobs, tone: 'violet' },
          { label: isRecruiter ? 'À surveiller' : 'Télétravail', value: isRecruiter ? activeRecruiterJobs.filter((job) => (job.applicationsCount ?? 0) === 0).length : remoteJobs.length, tone: 'emerald' },
        ].map(({ label, value, tone }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
            <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
          </div>
        ))}
      </section>

      {/* Recherche et filtres */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRecruiter ? 'Rechercher par poste, entreprise, lieu...' : 'Rechercher une offre par poste, entreprise, lieu...'}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
          />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Filter className="h-3.5 w-3.5" /> Source
            </span>
            <select
              value={selectedPlatform}
              onChange={(event) => setSelectedPlatform(event.target.value)}
              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">Toutes les plateformes</option>
              {platformPresets.map((preset) => (
                <option key={preset.id} value={preset.id}>{preset.label}</option>
              ))}
            </select>
            <span className="text-xs font-medium text-slate-400">{filteredJobs.length} résultat{filteredJobs.length === 1 ? '' : 's'}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
          {isRecruiter ? (
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
            >
              {showAddForm ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span>{showAddForm ? 'Masquer le formulaire' : 'Publier une offre'}</span>
            </button>
          ) : null}
          </div>
        </div>
      </section>

      {/* Raccourcis de plateforme */}
      <div className="flex flex-wrap items-center gap-1.5 px-1">
        <button
          type="button"
          onClick={() => setSelectedPlatform('all')}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            selectedPlatform === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Toutes ({jobs.length})
        </button>
        {platformPresets.map((preset) => {
          const count = jobs.filter((j) => j.platform.toLowerCase() === preset.id).length;
          if (count === 0 && selectedPlatform !== preset.id) return null;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => setSelectedPlatform(preset.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                selectedPlatform === preset.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {preset.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Collapsible Add Job Form */}
      {isRecruiter && showAddForm && (
        <div className="rounded-3xl border border-blue-200/80 bg-white p-6 sm:p-8 shadow-md shadow-blue-500/5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Publier une offre d'emploi</h2>
                <p className="text-xs text-slate-500">
                  Renseignez les informations de l'offre pour la rendre disponible aux candidats sur la plateforme.
                </p>
              </div>
            </div>
          </div>

          <form action={formAction} className="mt-6 space-y-4">
            {/* Platform preset selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Plateforme source *
              </label>
              <div className="flex flex-wrap gap-2">
                {platformPresets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPreset(p.id)}
                    className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                      selectedPreset === p.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <input type="hidden" name="platform" value={selectedPreset} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Identifiant / Référence *
                </label>
                <input
                  name="platformId"
                  required
                  defaultValue={`job-${Date.now().toString().slice(-6)}`}
                  placeholder="Ex: ref-48910"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Intitulé du poste *
                </label>
                <input
                  name="title"
                  required
                  placeholder="Ex: Lead Développeur React & TypeScript"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Entreprise *
                </label>
                <input
                  name="company"
                  required
                  placeholder="Ex: Qonto, Doctolib, Alan..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Localisation
                </label>
                <input
                  name="location"
                  placeholder="Ex: Paris / Full-Remote"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Salaire indicatif
                </label>
                <input
                  name="salary"
                  placeholder="Ex: 60k - 70k €"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Email de contact / candidature
                </label>
                <div className="relative flex items-center">
                  <div className="pointer-events-none absolute left-3 flex items-center">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    name="contactEmail"
                    type="email"
                    placeholder="Ex: recrutement@entreprise.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Lien web vers l'offre originale *
              </label>
              <div className="relative flex items-center">
                <div className="pointer-events-none absolute left-3 flex items-center">
                  <Globe className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  name="url"
                  type="url"
                  required
                  placeholder="https://www.linkedin.com/jobs/view/..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Description de l'offre (optionnel)
              </label>
              <textarea
                name="description"
                rows={4}
                placeholder="Collez ici les missions principales, compétences demandées, technologies..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {state.error ? (
              <div className="flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{state.error}</span>
              </div>
            ) : null}

            {state.success ? (
              <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{state.success}</span>
              </div>
            ) : null}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sauvegarde...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Enregistrer l'offre</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {statusError ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {statusError}
        </div>
      ) : null}

      {/* Jobs List */}
      <div className="space-y-3">
        {filteredJobs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Briefcase className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">
              {jobs.length === 0 ? (isRecruiter ? 'Aucune offre publiée pour le moment' : 'Aucune offre disponible pour le moment') : 'Aucune offre ne correspond à votre filtre'}
            </h3>
            <p className="mt-1.5 text-xs text-slate-500 max-w-md mx-auto">
              {jobs.length === 0
                ? (isRecruiter
                  ? "Publiez votre première offre pour commencer à recevoir des candidatures sur la plateforme."
                  : "Les offres apparaîtront ici dès qu'elles seront synchronisées ou publiées sur la plateforme.")
                : 'Essayez de modifier vos termes de recherche ou réinitialisez le filtre par plateforme.'}
            </p>
            {isRecruiter && jobs.length === 0 && !showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Publier une première offre</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {filteredJobs.map((job) => {
              const isExpanded = expandedDescriptions[job.id];
              const companyInitial = job.company?.[0]?.toUpperCase() || 'E';
              const score = 'score' in job ? (job.score as number | null) : null;

              return (
                <div
                  key={job.id}
                  className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-base font-bold text-white shadow-sm">
                        {companyInitial}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold leading-snug text-slate-900 sm:text-lg">{job.title}</h3>
                          {getPlatformBadge(job.platform)}
                          {isRecruiter && (
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              job.status === 'PUBLISHED'
                                ? 'bg-emerald-100 text-emerald-700'
                                : job.status === 'PAUSED'
                                  ? 'bg-amber-100 text-amber-700'
                                  : job.status === 'CLOSED'
                                    ? 'bg-slate-200 text-slate-600'
                                    : 'bg-blue-100 text-blue-700'
                            }`}>
                              {statusLabels[job.status]}
                            </span>
                          )}
                          {!isRecruiter && score !== null && preferences && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${getScoreColor(score)}`}
                              title={getScoreLabel(score)}
                            >
                              {score}% match
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span className="flex items-center gap-1 font-semibold text-slate-800">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            {job.company}
                          </span>

                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              {job.location}
                            </span>
                          )}

                          {job.salary && (
                            <span className="flex items-center gap-1 font-semibold text-emerald-600">
                              <Banknote className="h-3.5 w-3.5 text-emerald-500" />
                              {job.salary}
                            </span>
                          )}

                          {job.contactEmail && (
                            <a
                              href={`mailto:${job.contactEmail}?subject=${encodeURIComponent(`Candidature : ${job.title}`)}`}
                              className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                              title="Envoyer une candidature par email"
                            >
                              <Mail className="h-3.5 w-3.5 text-blue-500" />
                              <span>{job.contactEmail}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
                      {isRecruiter ? (
                        <>
                          <Link
                            href={`/dashboard/jobs/${job.id}/applications`}
                            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-900 sm:flex-none"
                          >
                            <Users className="h-3.5 w-3.5 text-slate-600" />
                            <span>
                              {job.applicationsCount ?? 0} candidature{(job.applicationsCount ?? 0) > 1 ? 's' : ''}
                            </span>
                          </Link>
                          {job.status === 'PUBLISHED' ? (
                            <button type="button" disabled={statusPending} onClick={() => changeJobStatus(job.id, 'PAUSED')} aria-label="Mettre l'offre en pause" title="Mettre en pause" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-3 text-amber-700 transition hover:bg-amber-100 disabled:opacity-50">
                              <Pause className="h-4 w-4" />
                            </button>
                          ) : job.status === 'PAUSED' ? (
                            <button type="button" disabled={statusPending} onClick={() => changeJobStatus(job.id, 'PUBLISHED')} aria-label="Reprendre l'offre" title="Reprendre" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50">
                              <Play className="h-4 w-4" />
                            </button>
                          ) : job.status === 'DRAFT' ? (
                            <button type="button" disabled={statusPending} onClick={() => changeJobStatus(job.id, 'PUBLISHED')} aria-label="Publier l'offre" title="Publier" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-3 text-blue-700 transition hover:bg-blue-100 disabled:opacity-50">
                              <Play className="h-4 w-4" />
                            </button>
                          ) : null}
                          {job.status !== 'CLOSED' && (
                            <button type="button" disabled={statusPending} onClick={() => changeJobStatus(job.id, 'CLOSED')} aria-label="Fermer l'offre" title="Fermer" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-600 transition hover:bg-slate-100 disabled:opacity-50">
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      ) : (
                        <Link
                          href={`/dashboard/jobs/${job.id}`}
                          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:flex-none"
                        >
                          <span>Voir les détails</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {job.description && (
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-slate-800">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
                            <AlignLeft className="h-3.5 w-3.5" />
                          </div>
                          <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
                            Aperçu du poste
                          </h4>
                        </div>
                        {job.description.length > 120 && (
                          <button
                            type="button"
                            onClick={() => toggleDescription(job.id)}
                            aria-expanded={isExpanded}
                            className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          >
                            <span>{isExpanded ? 'Réduire' : 'Lire plus'}</span>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>
                      <p className={`mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-slate-600 ${isExpanded ? '' : 'line-clamp-3'}`}>
                        {job.description}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
