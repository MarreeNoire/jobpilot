'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  type RecruiterApplication,
  updateApplicationStatusByRecruiterAction,
  updateRecruiterNoteAction,
} from '@/app/dashboard/jobs/[id]/applications/actions';
import type { Application } from '@/app/dashboard/applications/actions';
import { recruiterPipelineStatuses } from '@/app/dashboard/applications/types';
import { FileText, Mail, Phone, StickyNote, User } from 'lucide-react';

interface RecruiterApplicationBoardProps {
  jobId: string;
  applications: RecruiterApplication[];
}

const columnConfig: Record<(typeof recruiterPipelineStatuses)[number], { label: string; accent: string }> = {
  PENDING: { label: 'Reçues', accent: 'border-slate-300 bg-slate-50' },
  REVIEWING: { label: 'En examen', accent: 'border-blue-200 bg-blue-50' },
  SHORTLISTED: { label: 'Présélectionnées', accent: 'border-amber-200 bg-amber-50' },
  INTERVIEW_SCHEDULED: { label: 'Entretien planifié', accent: 'border-indigo-200 bg-indigo-50' },
  ACCEPTED: { label: 'Acceptées', accent: 'border-emerald-200 bg-emerald-50' },
  REJECTED: { label: 'Refusées', accent: 'border-red-200 bg-red-50' },
};

function ApplicationCard({ jobId, application }: { jobId: string; application: RecruiterApplication }) {
  const [note, setNote] = useState(application.recruiterNotes ?? '');
  const [showNote, setShowNote] = useState(false);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleStatusChange = async (status: Application['status']) => {
    setPending(true);
    const result = await updateApplicationStatusByRecruiterAction(jobId, application.id, status);
    setFeedback(result.error ?? result.success ?? null);
    setPending(false);
  };

  const handleSaveNote = async () => {
    setPending(true);
    const result = await updateRecruiterNoteAction(jobId, application.id, note);
    setFeedback(result.error ?? result.success ?? null);
    setPending(false);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <User className="h-3.5 w-3.5 text-slate-400" />
            {application.candidate.firstName} {application.candidate.lastName}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <Mail className="h-3 w-3 text-slate-400" />
            {application.candidate.email}
          </p>
          {application.candidate.phone ? (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
              <Phone className="h-3 w-3 text-slate-400" />
              {application.candidate.phone}
            </p>
          ) : null}
        </div>
        {application.resume ? (
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
            <FileText className="h-3 w-3" />
            CV
          </span>
        ) : null}
      </div>

      <select
        value={application.status}
        disabled={pending}
        onChange={(event) => void handleStatusChange(event.target.value as Application['status'])}
        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
      >
        {recruiterPipelineStatuses.map((status) => (
          <option key={status} value={status}>
            {columnConfig[status].label}
          </option>
        ))}
      </select>

      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/jobs/${jobId}/applications/${application.id}`}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          Voir la fiche candidat →
        </Link>
        <button
          type="button"
          onClick={() => setShowNote((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          <StickyNote className="h-3.5 w-3.5" />
          Note
        </button>
      </div>

      {showNote ? (
        <div className="space-y-2 border-t border-slate-100 pt-2">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder="Note interne (visible uniquement par les recruteurs)…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
          />
          <button
            type="button"
            disabled={pending}
            onClick={handleSaveNote}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
          >
            Enregistrer la note
          </button>
        </div>
      ) : null}

      {feedback ? <p className="text-[11px] text-slate-500">{feedback}</p> : null}
    </div>
  );
}

export function RecruiterApplicationBoard({ jobId, applications }: RecruiterApplicationBoardProps) {
  if (applications.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
        Aucune candidature reçue pour cette offre pour le moment.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {recruiterPipelineStatuses.map((status) => {
        const columnApplications = applications.filter((application) => application.status === status);
        const { label, accent } = columnConfig[status];

        return (
          <div key={status} className={`space-y-3 rounded-2xl border p-3 ${accent}`}>
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}</h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                {columnApplications.length}
              </span>
            </div>
            <div className="space-y-3">
              {columnApplications.map((application) => (
                <ApplicationCard key={application.id} jobId={jobId} application={application} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
