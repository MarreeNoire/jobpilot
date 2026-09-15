'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import type { RecruiterApplication } from '@/app/dashboard/jobs/[id]/applications/actions';
import { updateApplicationStatusByRecruiterAction } from '@/app/dashboard/jobs/[id]/applications/actions';
import type { Application } from '@/app/dashboard/applications/actions';
import { CheckCircle2, Clock, Eye, Mail, Phone, Users, XCircle, Loader2 } from 'lucide-react';

type PipelineStatus = 'PENDING' | 'REVIEWING' | 'SHORTLISTED' | 'INTERVIEW_SCHEDULED' | 'ACCEPTED' | 'REJECTED';

const COLUMNS: { status: PipelineStatus; label: string; color: string; headerBg: string; dotColor: string }[] = [
  { status: 'PENDING',            label: 'En attente',         color: 'border-slate-200',  headerBg: 'bg-slate-100',  dotColor: 'bg-slate-400' },
  { status: 'REVIEWING',          label: 'En examen',          color: 'border-blue-200',   headerBg: 'bg-blue-50',    dotColor: 'bg-blue-500'  },
  { status: 'SHORTLISTED',        label: 'Présélectionné',     color: 'border-indigo-200', headerBg: 'bg-indigo-50',  dotColor: 'bg-indigo-500' },
  { status: 'INTERVIEW_SCHEDULED',label: 'Entretien planifié', color: 'border-amber-200',  headerBg: 'bg-amber-50',   dotColor: 'bg-amber-500' },
  { status: 'ACCEPTED',           label: 'Accepté',            color: 'border-emerald-200',headerBg: 'bg-emerald-50', dotColor: 'bg-emerald-500'},
  { status: 'REJECTED',           label: 'Refusé',             color: 'border-red-200',    headerBg: 'bg-red-50',     dotColor: 'bg-red-400'   },
];

const NEXT_STATUSES: Partial<Record<PipelineStatus, PipelineStatus[]>> = {
  PENDING:             ['REVIEWING', 'REJECTED'],
  REVIEWING:           ['SHORTLISTED', 'REJECTED'],
  SHORTLISTED:         ['INTERVIEW_SCHEDULED', 'REJECTED'],
  INTERVIEW_SCHEDULED: ['ACCEPTED', 'REJECTED'],
};

interface KanbanCardProps {
  application: RecruiterApplication;
  jobId: string;
}

function KanbanCard({ application, jobId }: KanbanCardProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<PipelineStatus | null>(null);
  const [message, setMessage] = useState('');

  const currentStatus = (application.status === 'SUBMITTED' ? 'PENDING' : application.status) as PipelineStatus;
  const nextStatuses = NEXT_STATUSES[currentStatus] ?? [];
  const candidate = application.candidate;

  function handleMoveClick(status: PipelineStatus) {
    if (status === 'INTERVIEW_SCHEDULED' || status === 'REJECTED') {
      setPendingStatus(status);
      setShowMessageInput(true);
      setMessage('');
    } else {
      applyStatusChange(status, undefined);
    }
  }

  function applyStatusChange(status: PipelineStatus, msg: string | undefined) {
    startTransition(async () => {
      const result = await updateApplicationStatusByRecruiterAction(jobId, application.id, status as Application['status'], msg);
      setFeedback(result.error ?? result.success ?? null);
      setShowMessageInput(false);
      setPendingStatus(null);
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      {/* Identité candidat */}
      <div className="space-y-0.5">
        <p className="text-sm font-bold text-slate-900">
          {candidate.firstName} {candidate.lastName}
        </p>
        <p className="flex items-center gap-1 text-xs text-slate-500">
          <Mail className="h-3 w-3" />
          {candidate.email}
        </p>
        {candidate.phone && (
          <p className="flex items-center gap-1 text-xs text-slate-500">
            <Phone className="h-3 w-3" />
            {candidate.phone}
          </p>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        {application.resume && (
          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">CV joint</span>
        )}
        {application.coverLetter && (
          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">Lettre jointe</span>
        )}
        {application.submittedAt && (
          <span className="flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
            <Clock className="h-3 w-3" />
            {new Date(application.submittedAt).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>

      {/* Lien fiche complète */}
      <Link
        href={`/dashboard/jobs/${jobId}/applications/${application.id}`}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition"
      >
        <Eye className="h-3.5 w-3.5" />
        <span>Voir la fiche complète</span>
      </Link>

      {/* Actions de déplacement de statut */}
      {nextStatuses.length > 0 && (
        <div className="space-y-2 border-t border-slate-100 pt-2">
          {showMessageInput && pendingStatus ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-600">
                Message pour le candidat <span className="text-slate-400">(optionnel)</span>
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                placeholder={pendingStatus === 'REJECTED' ? 'Expliquez brièvement le motif...' : 'Informations sur l\'entretien...'}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => applyStatusChange(pendingStatus, message || undefined)}
                  disabled={isPending}
                  className="flex-1 rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {isPending ? <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" /> : 'Confirmer'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowMessageInput(false); setPendingStatus(null); }}
                  className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-600"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {nextStatuses.map((status) => {
                const col = COLUMNS.find((c) => c.status === status);
                const isReject = status === 'REJECTED';
                return (
                  <button
                    key={status}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleMoveClick(status)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-60 ${
                      isReject
                        ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                        : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {isReject ? <XCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                    {col?.label ?? status}
                  </button>
                );
              })}
            </div>
          )}
          {feedback && (
            <p className={`text-[11px] font-medium ${feedback.startsWith('Statut') ? 'text-emerald-600' : 'text-red-500'}`}>
              {feedback}
            </p>
          )}
        </div>
      )}

      {isPending && !showMessageInput && (
        <p className="flex items-center gap-1 text-[11px] text-slate-500">
          <Loader2 className="h-3 w-3 animate-spin" /> Mise à jour…
        </p>
      )}
    </div>
  );
}

interface KanbanBoardProps {
  jobId: string;
  applications: RecruiterApplication[];
}

export function KanbanBoard({ jobId, applications }: KanbanBoardProps) {
  const normalizedStatus = (status: string): PipelineStatus =>
    (status === 'SUBMITTED' ? 'PENDING' : status) as PipelineStatus;

  const byStatus = Object.fromEntries(
    COLUMNS.map((col) => [
      col.status,
      applications.filter((a) => normalizedStatus(a.status) === col.status),
    ])
  ) as Record<PipelineStatus, RecruiterApplication[]>;

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
          <Users className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-900">Aucune candidature reçue pour le moment</h3>
        <p className="mt-2 max-w-sm text-xs text-slate-500">
          Les candidatures apparaîtront ici dès que des candidats postuleront à cette offre.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4" style={{ minWidth: `${COLUMNS.length * 260}px` }}>
        {COLUMNS.map((col) => {
          const colApps = byStatus[col.status] ?? [];
          return (
            <div key={col.status} className="flex w-60 flex-none flex-col gap-3">
              {/* En-tête colonne */}
              <div className={`flex items-center justify-between rounded-xl border ${col.color} ${col.headerBg} px-3 py-2`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.dotColor}`} />
                  <span className="text-xs font-bold text-slate-700">{col.label}</span>
                </div>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-slate-600 shadow-sm">
                  {colApps.length}
                </span>
              </div>

              {/* Cartes */}
              <div className="flex flex-col gap-2">
                {colApps.map((app) => (
                  <KanbanCard key={app.id} application={app} jobId={jobId} />
                ))}
                {colApps.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
                    <p className="text-[11px] text-slate-400">Aucune candidature</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


