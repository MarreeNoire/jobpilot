'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { RecruiterApplication } from '@/app/dashboard/jobs/[id]/applications/actions';
import { ArrowUpDown, Eye, Filter, Search, StickyNote } from 'lucide-react';

type StatusFilter = 'ALL' | RecruiterApplication['status'];
type SortKey = 'updatedAt' | 'candidate' | 'status';

const statusLabels: Record<string, string> = {
  PENDING: 'En attente',
  REVIEWING: 'En examen',
  SHORTLISTED: 'Preselectionnee',
  INTERVIEW_SCHEDULED: 'Entretien planifie',
  ACCEPTED: 'Acceptee',
  REJECTED: 'Refusee',
  SUBMITTED: 'Soumise',
  PROCESSING: 'En traitement',
  WAITING_USER: 'En attente candidat',
  INTERVIEW: 'Entretien',
};

const statusStyles: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-700',
  REVIEWING: 'bg-blue-50 text-blue-700',
  SHORTLISTED: 'bg-amber-50 text-amber-700',
  INTERVIEW_SCHEDULED: 'bg-indigo-50 text-indigo-700',
  ACCEPTED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
};

const recruiterStatuses = ['PENDING', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'ACCEPTED', 'REJECTED'] as const;

function statusLabel(status: string): string {
  return statusLabels[status] ?? status;
}

export function RecruiterApplicationsTable({ applications, initialStatus = 'ALL' }: { applications: RecruiterApplication[]; initialStatus?: string }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>(
    initialStatus === 'ALL' || recruiterStatuses.includes(initialStatus as (typeof recruiterStatuses)[number])
      ? (initialStatus as StatusFilter)
      : 'ALL',
  );
  const [sort, setSort] = useState<SortKey>('updatedAt');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return [...applications]
      .filter((application) => status === 'ALL' || application.status === status)
      .filter((application) => {
        if (!normalizedQuery) return true;
        const searchable = [
          application.candidate.firstName,
          application.candidate.lastName,
          application.candidate.email,
          application.job?.title,
          application.job?.company,
        ].filter(Boolean).join(' ').toLocaleLowerCase();
        return searchable.includes(normalizedQuery);
      })
      .sort((left, right) => {
        if (sort === 'candidate') {
          return `${left.candidate.lastName}${left.candidate.firstName}`.localeCompare(
            `${right.candidate.lastName}${right.candidate.firstName}`,
            'fr',
          );
        }
        if (sort === 'status') {
          return statusLabel(left.status).localeCompare(statusLabel(right.status), 'fr');
        }
        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      });
  }, [applications, query, sort, status]);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / PAGE_SIZE));
  const paginatedApplications = filteredApplications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Toutes les candidatures</h2>
          <p className="mt-1 text-xs text-slate-500">
            {filteredApplications.length} resultat{filteredApplications.length > 1 ? 's' : ''} sur {applications.length} candidature{applications.length > 1 ? 's' : ''}.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_auto_auto]">
          <label className="relative block">
            <span className="sr-only">Rechercher une candidature</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => { setPage(1); setQuery(event.target.value); }}
              placeholder="Candidat, poste, entreprise..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="relative block">
            <span className="sr-only">Filtrer par statut</span>
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <select
              value={status}
              onChange={(event) => { setPage(1); setStatus(event.target.value as StatusFilter); }}
              className="h-full w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-7 text-xs font-medium text-slate-700 outline-none focus:border-blue-400 focus:bg-white"
            >
              <option value="ALL">Tous les statuts</option>
              {recruiterStatuses.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}
            </select>
          </label>
          <label className="relative block">
            <span className="sr-only">Trier les candidatures</span>
            <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="h-full w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-7 text-xs font-medium text-slate-700 outline-none focus:border-blue-400 focus:bg-white"
            >
              <option value="updatedAt">Plus recentes</option>
              <option value="candidate">Nom du candidat</option>
              <option value="status">Statut</option>
            </select>
          </label>
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-10 text-center">
          <p className="text-sm font-semibold text-slate-700">Aucune candidature ne correspond a ces filtres</p>
          <p className="mt-1 text-xs text-slate-500">Essayez une autre recherche ou reinitialisez le statut selectionne.</p>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-400">
                <th className="px-3 py-1 font-semibold">Candidat</th>
                <th className="px-3 py-1 font-semibold">Offre</th>
                <th className="px-3 py-1 font-semibold">Statut</th>
                <th className="px-3 py-1 font-semibold">Mise a jour</th>
                <th className="px-3 py-1 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedApplications.map((application) => (
                <tr key={application.id} className="rounded-xl bg-slate-50/70 text-sm transition hover:bg-blue-50/50">
                  <td className="rounded-l-xl px-3 py-3">
                    <p className="font-semibold text-slate-900">{application.candidate.firstName} {application.candidate.lastName}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{application.candidate.email}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-slate-800">{application.job?.title ?? 'Offre indisponible'}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{application.job?.company ?? '?'}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[application.status] ?? 'bg-slate-100 text-slate-700'}`}>
                      {statusLabel(application.status)}
                    </span>
                    {application.status === 'INTERVIEW_SCHEDULED' && <p className="mt-1 text-[10px] text-indigo-600">A preparer</p>}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500">
                    {new Date(application.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="rounded-r-xl px-3 py-3 text-right">
                    <Link
                      href={`/dashboard/jobs/${application.jobId}/applications/${application.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-50"
                    >
                      <Eye className="h-3.5 w-3.5" /> Voir la fiche
                    </Link>
                    {application.recruiterNotes && <StickyNote className="ml-2 inline h-3.5 w-3.5 align-middle text-amber-500" aria-label="Note interne" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-[11px] text-slate-400">
        Les changements de statut et les notifications se font depuis la fiche candidat afin d&apos;eviter les actions groupees accidentelles.
      </p>

      {totalPages > 1 && (
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
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
  );
}
