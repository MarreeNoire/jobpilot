'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  scheduleInterviewAction,
  updateApplicationStatusByRecruiterAction,
  updateRecruiterNoteAction,
  acceptApplicationAction,
} from '@/app/dashboard/jobs/[id]/applications/actions';
import type { Application } from '@/app/dashboard/applications/actions';
import type { RecruiterInterview } from '@/app/dashboard/jobs/[id]/applications/actions';
import { CalendarDays, CheckCircle2, Loader2, MessageSquare, Send, Video } from 'lucide-react';

type PipelineStatus = 'PENDING' | 'REVIEWING' | 'SHORTLISTED' | 'INTERVIEW_SCHEDULED' | 'ACCEPTED' | 'REJECTED';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  SUBMITTED: 'Soumise',
  REVIEWING: 'En examen',
  SHORTLISTED: 'Preselectionne(e)',
  INTERVIEW_SCHEDULED: 'Entretien planifie',
  REJECTED: 'Non retenu(e)',
};

const NEXT_STATUSES: Partial<Record<PipelineStatus, PipelineStatus[]>> = {
  PENDING: ['REVIEWING', 'REJECTED'],
  REVIEWING: ['SHORTLISTED', 'REJECTED'],
  SHORTLISTED: ['INTERVIEW_SCHEDULED', 'REJECTED'],
  INTERVIEW_SCHEDULED: ['REJECTED'],
};


interface RecruiterActionsPanelProps {
  jobId: string;
  applicationId: string;
  currentStatus: Application['status'];
  recruiterNotes: string | null;
  hiringMessage: string | null;
  interviews: RecruiterInterview[];
}

export function RecruiterActionsPanel({
  jobId,
  applicationId,
  currentStatus,
  recruiterNotes,
  hiringMessage,
  interviews,
}: RecruiterActionsPanelProps) {
  const router = useRouter();
  const [isPendingStatus, startStatusTransition] = useTransition();
  const [isPendingNote, startNoteTransition] = useTransition();
  const [isPendingAccept, startAcceptTransition] = useTransition();

  const [selectedStatus, setSelectedStatus] = useState<PipelineStatus>(
    currentStatus as PipelineStatus
  );
  const [statusMessage, setStatusMessage] = useState('');
  const [statusFeedback, setStatusFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  const [notes, setNotes] = useState(recruiterNotes ?? '');
  const [notesFeedback, setNotesFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  const [hiring, setHiring] = useState(hiringMessage ?? '');
  const [hiringFeedback, setHiringFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const [isPendingInterview, startInterviewTransition] = useTransition();
  const [interviewDateTime, setInterviewDateTime] = useState('');
  const [interviewTimezone, setInterviewTimezone] = useState('UTC');
  const [interviewMode, setInterviewMode] = useState<'VIDEO' | 'PHONE' | 'ONSITE'>('VIDEO');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [interviewFeedback, setInterviewFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    setInterviewTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  }, []);

  const isAccepted = currentStatus === 'ACCEPTED';
  const isTerminal = isAccepted || currentStatus === 'REJECTED';
  const nextStatuses = currentStatus === 'SUBMITTED'
    ? (['REVIEWING', 'REJECTED'] as PipelineStatus[])
    : (NEXT_STATUSES[currentStatus as PipelineStatus] ?? []);
  const statusOptions = Array.from(new Set([currentStatus as PipelineStatus, ...nextStatuses]));

  function handleStatusSubmit() {
    startStatusTransition(async () => {
      const result = await updateApplicationStatusByRecruiterAction(
        jobId,
        applicationId,
        selectedStatus as Application['status'],
        statusMessage.trim() || undefined
      );
      setStatusFeedback({
        text: result.error ?? result.success ?? '',
        ok: !result.error,
      });
      if (!result.error) {
        router.refresh();
      }
    });
  }

  function handleNoteSave() {
    startNoteTransition(async () => {
      const result = await updateRecruiterNoteAction(jobId, applicationId, notes);
      setNotesFeedback({ text: result.error ?? result.success ?? '', ok: !result.error });
      if (!result.error) {
        router.refresh();
      }
    });
  }

  function handleAccept() {
    startAcceptTransition(async () => {
      const result = await acceptApplicationAction(jobId, applicationId, hiring);
      setHiringFeedback({ text: result.error ?? result.success ?? '', ok: !result.error });
      if (!result.error) {
        router.refresh();
      }
    });
  }

  function handleInterviewSubmit() {
    if (!interviewDateTime) {
      setInterviewFeedback({ text: 'Choisissez une date et une heure.', ok: false });
      return;
    }

    startInterviewTransition(async () => {
      const result = await scheduleInterviewAction(jobId, applicationId, {
        scheduledAt: new Date(interviewDateTime).toISOString(),
        timezone: interviewTimezone,
        mode: interviewMode,
        meetingUrl: meetingUrl.trim() || undefined,
        notes: interviewNotes.trim() || undefined,
      });
      setInterviewFeedback({ text: result.error ?? result.success ?? '', ok: !result.error });
      if (!result.error) {
        setInterviewDateTime('');
        setMeetingUrl('');
        setInterviewNotes('');
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 sticky top-24">

      {/* ─── Entretien ─── */}
      {!isTerminal && (
      <section className="rounded-3xl border border-indigo-200 bg-indigo-50/60 p-5 shadow-sm space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <CalendarDays className="h-4 w-4 text-indigo-600" />
          Planifier un entretien
        </h2>

        {interviews.length > 0 && (
          <div className="space-y-2">
            {interviews.map((interview) => (
              <div key={interview.id} className="rounded-2xl border border-indigo-100 bg-white p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-800">
                    {new Date(interview.scheduledAt).toLocaleString('fr-FR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                      timeZone: interview.timezone,
                    })}
                  </p>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">
                    {interview.status === 'SCHEDULED' ? 'Planifié' : interview.status}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-slate-500">
                  <Video className="h-3 w-3" />{interview.mode === 'VIDEO' ? 'Visioconférence' : interview.mode === 'PHONE' ? 'Téléphone' : 'Sur site'} · {interview.timezone}
                </p>
                {interview.meetingUrl && (
                  <a href={interview.meetingUrl} target="_blank" rel="noreferrer" className="mt-1 block truncate font-medium text-indigo-700 hover:underline">
                    {interview.meetingUrl}
                  </a>
                )}
                {interview.notes && <p className="mt-1 whitespace-pre-wrap text-slate-600">{interview.notes}</p>}
              </div>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Date et heure</label>
          <input
            type="datetime-local"
            value={interviewDateTime}
            onChange={(event) => setInterviewDateTime(event.target.value)}
            className="w-full rounded-xl border border-indigo-100 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1.5">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Fuseau</span>
            <input
              value={interviewTimezone}
              onChange={(event) => setInterviewTimezone(event.target.value)}
              placeholder="Europe/Paris"
              className="w-full rounded-xl border border-indigo-100 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-400"
            />
          </label>
          <label className="space-y-1.5">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Format</span>
            <select
              value={interviewMode}
              onChange={(event) => setInterviewMode(event.target.value as typeof interviewMode)}
              className="w-full rounded-xl border border-indigo-100 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-400"
            >
              <option value="VIDEO">Visio</option>
              <option value="PHONE">Téléphone</option>
              <option value="ONSITE">Sur site</option>
            </select>
          </label>
        </div>
        <input
          value={meetingUrl}
          onChange={(event) => setMeetingUrl(event.target.value)}
          placeholder="Lien de réunion (optionnel)"
          className="w-full rounded-xl border border-indigo-100 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-400"
        />
        <textarea
          value={interviewNotes}
          onChange={(event) => setInterviewNotes(event.target.value)}
          rows={2}
          placeholder="Instructions ou informations pour le candidat (optionnel)"
          className="w-full resize-none rounded-xl border border-indigo-100 bg-white p-3 text-xs text-slate-900 outline-none focus:border-indigo-400"
        />
        {interviewFeedback && (
          <p className={`text-xs font-medium ${interviewFeedback.ok ? 'text-emerald-700' : 'text-red-500'}`}>
            {interviewFeedback.text}
          </p>
        )}
        <button
          type="button"
          disabled={isPendingInterview || !interviewDateTime || !interviewTimezone.trim()}
          onClick={handleInterviewSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPendingInterview ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
          Planifier &amp; notifier
        </button>
      </section>
      )}

      {/* ─── Changer le statut ─── */}
      {!isTerminal && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Send className="h-4 w-4 text-blue-500" />
            Gérer la candidature
          </h2>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Statut</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as PipelineStatus)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>{STATUS_LABELS[status] ?? status}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Message au candidat <span className="font-normal normal-case text-slate-400">(optionnel)</span>
            </label>
            <textarea
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              rows={3}
              placeholder="Informations complémentaires pour le candidat..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {statusFeedback && (
            <p className={`text-xs font-medium ${statusFeedback.ok ? 'text-emerald-600' : 'text-red-500'}`}>
              {statusFeedback.text}
            </p>
          )}

          <p className="text-[11px] text-slate-500">Les etapes proposees suivent le parcours du pipeline. Une notification sera envoyee au candidat lors du changement.</p>

          <button
            type="button"
            disabled={isPendingStatus || selectedStatus === currentStatus}
            onClick={handleStatusSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPendingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Appliquer & notifier
          </button>
        </section>
      )}

      {/* ─── Valider (ACCEPTED) ─── */}
      {!isTerminal && (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Valider la candidature
          </h2>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Message de confirmation / promesse d&apos;embauche <span className="text-red-400">*</span>
            </label>
            <textarea
              value={hiring}
              onChange={(e) => setHiring(e.target.value)}
              rows={4}
              placeholder="Bonjour, nous avons le plaisir de vous informer que votre candidature a été retenue..."
              className="w-full resize-none rounded-xl border border-emerald-200 bg-white p-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {hiringFeedback && (
            <p className={`text-xs font-medium ${hiringFeedback.ok ? 'text-emerald-700' : 'text-red-500'}`}>
              {hiringFeedback.text}
            </p>
          )}

          <button
            type="button"
            disabled={isPendingAccept || !hiring.trim()}
            onClick={handleAccept}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPendingAccept ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Valider &amp; envoyer l&apos;offre
          </button>
        </section>
      )}

      {/* ─── Note interne ─── */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <MessageSquare className="h-4 w-4 text-amber-500" />
          Note interne
          <span className="text-xs font-normal text-slate-400">(invisible pour le candidat)</span>
        </h2>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Observations sur le profil, points à vérifier en entretien, impressions générales..."
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
        />

        {notesFeedback && (
          <p className={`text-xs font-medium ${notesFeedback.ok ? 'text-emerald-600' : 'text-red-500'}`}>
            {notesFeedback.text}
          </p>
        )}

        <button
          type="button"
          disabled={isPendingNote}
          onClick={handleNoteSave}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-50 hover:border-amber-200 disabled:opacity-60"
        >
          {isPendingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
          Enregistrer la note
        </button>
      </section>

      {/* Confirmation ACCEPTED */}
      {isAccepted && hiringMessage && (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-emerald-800">Candidature validée</h2>
          </div>
          <p className="text-xs text-emerald-700 leading-relaxed">{hiringMessage}</p>
        </section>
      )}
    </div>
  );
}
