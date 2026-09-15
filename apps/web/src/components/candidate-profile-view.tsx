'use client';

import { useState } from 'react';
import {
  type RecruiterApplicationDetail,
  acceptApplicationAction,
  updateApplicationStatusByRecruiterAction,
  updateRecruiterNoteAction,
} from '@/app/dashboard/jobs/[id]/applications/actions';
import { recruiterPipelineStatuses } from '@/app/dashboard/applications/types';
import type { Application } from '@/app/dashboard/applications/actions';
import {
  Award,
  Briefcase,
  CheckCircle2,
  FileText,
  GraduationCap,
  Mail,
  Phone,
  Send,
  StickyNote,
} from 'lucide-react';

interface CandidateProfileViewProps {
  jobId: string;
  application: RecruiterApplicationDetail;
}

const statusLabels: Record<(typeof recruiterPipelineStatuses)[number], string> = {
  PENDING: 'Reçue',
  REVIEWING: 'En cours d’examen',
  SHORTLISTED: 'Présélectionnée',
  INTERVIEW_SCHEDULED: 'Entretien planifié',
  ACCEPTED: 'Acceptée',
  REJECTED: 'Refusée',
};

function formatDate(value: string | null): string {
  if (!value) return 'En cours';
  return new Date(value).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
}

export function CandidateProfileView({ jobId, application }: CandidateProfileViewProps) {
  const { candidate } = application;
  const [status, setStatus] = useState(application.status);
  const [statusMessage, setStatusMessage] = useState('');
  const [note, setNote] = useState(application.recruiterNotes ?? '');
  const [hiringMessage, setHiringMessage] = useState(application.hiringMessage ?? '');
  const [pending, setPending] = useState<'status' | 'note' | 'accept' | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleStatusChange = async () => {
    setPending('status');
    const result = await updateApplicationStatusByRecruiterAction(
      jobId,
      application.id,
      status as Application['status'],
      statusMessage
    );
    setFeedback(result.error ?? result.success ?? null);
    setPending(null);
  };

  const handleSaveNote = async () => {
    setPending('note');
    const result = await updateRecruiterNoteAction(jobId, application.id, note);
    setFeedback(result.error ?? result.success ?? null);
    setPending(null);
  };

  const handleAccept = async () => {
    setPending('accept');
    const result = await acceptApplicationAction(jobId, application.id, hiringMessage);
    setFeedback(result.error ?? result.success ?? null);
    if (!result.error) {
      setStatus('ACCEPTED');
    }
    setPending(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Colonne principale : profil candidat */}
      <section className="space-y-6 lg:col-span-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            {candidate.firstName} {candidate.lastName}
          </h2>
          {candidate.profile?.title ? (
            <p className="mt-1 text-sm font-medium text-slate-600">{candidate.profile.title}</p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-slate-400" />
              {candidate.email}
            </span>
            {candidate.phone ? (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-slate-400" />
                {candidate.phone}
              </span>
            ) : null}
          </div>

          {candidate.profile?.professionalSummary ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {candidate.profile.professionalSummary}
            </p>
          ) : null}
        </div>

        {/* Compétences */}
        {candidate.skills.length > 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
              <Award className="h-4 w-4 text-slate-400" />
              Compétences
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {candidate.skills.map((skill) => (
                <span
                  key={skill.id}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  {skill.name}
                  {skill.level ? ` · ${skill.level}/5` : ''}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {/* Expériences */}
        {candidate.experiences.length > 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
              <Briefcase className="h-4 w-4 text-slate-400" />
              Parcours professionnel
            </h3>
            <div className="mt-3 space-y-4">
              {candidate.experiences.map((experience) => (
                <div key={experience.id} className="border-l-2 border-slate-200 pl-4">
                  <p className="text-sm font-semibold text-slate-900">{experience.position}</p>
                  <p className="text-xs text-slate-500">
                    {experience.company} · {formatDate(experience.startDate)} — {formatDate(experience.endDate)}
                  </p>
                  {experience.description ? (
                    <p className="mt-1 text-xs leading-5 text-slate-600">{experience.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Formations */}
        {candidate.educations.length > 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
              <GraduationCap className="h-4 w-4 text-slate-400" />
              Formation
            </h3>
            <div className="mt-3 space-y-4">
              {candidate.educations.map((education) => (
                <div key={education.id} className="border-l-2 border-slate-200 pl-4">
                  <p className="text-sm font-semibold text-slate-900">{education.degree}</p>
                  <p className="text-xs text-slate-500">
                    {education.institution}
                    {education.fieldOfStudy ? ` · ${education.fieldOfStudy}` : ''} ·{' '}
                    {formatDate(education.startDate)} — {formatDate(education.endDate)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* CV & lettre de motivation */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
            <FileText className="h-4 w-4 text-slate-400" />
            CV & lettre de motivation
          </h3>
          <div className="mt-3 space-y-3">
            {application.resume ? (
              <div className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="font-medium text-slate-900">{application.resume.title}</p>
                {application.resume.fileUrl ? (
                  <a
                    href={application.resume.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Ouvrir le CV
                  </a>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Aucun CV joint à cette candidature.</p>
            )}

            {application.coverLetter ? (
              <div className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="font-medium text-slate-900">{application.coverLetter.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                  {application.coverLetter.content}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Aucune lettre de motivation jointe.</p>
            )}
          </div>
        </div>
      </section>

      {/* Colonne latérale : actions recruteur */}
      <aside className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Statut de la candidature</h3>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {recruiterPipelineStatuses.map((value) => (
              <option key={value} value={value}>
                {statusLabels[value]}
              </option>
            ))}
          </select>
          <textarea
            value={statusMessage}
            onChange={(event) => setStatusMessage(event.target.value)}
            rows={3}
            placeholder="Message optionnel envoyé au candidat (sinon un message par défaut est utilisé)…"
            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
          />
          <button
            type="button"
            disabled={pending === 'status'}
            onClick={handleStatusChange}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Send className="h-3.5 w-3.5" />
            {pending === 'status' ? 'Envoi…' : 'Mettre à jour et notifier'}
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
            <StickyNote className="h-4 w-4 text-slate-400" />
            Note interne (recruteurs uniquement)
          </h3>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            placeholder="Impressions, points à vérifier, retours d'entretien…"
            className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
          />
          <button
            type="button"
            disabled={pending === 'note'}
            onClick={handleSaveNote}
            className="mt-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
          >
            {pending === 'note' ? 'Enregistrement…' : 'Enregistrer la note'}
          </button>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Valider la candidature
          </h3>
          <p className="mt-1 text-xs text-emerald-800/80">
            Joignez une promesse d'embauche ou un message de confirmation qui sera envoyé au candidat.
          </p>
          <textarea
            value={hiringMessage}
            onChange={(event) => setHiringMessage(event.target.value)}
            rows={4}
            placeholder="Ex : Nous avons le plaisir de vous confirmer notre décision de vous embaucher au poste de…"
            className="mt-3 w-full rounded-lg border border-emerald-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            disabled={pending === 'accept' || status === 'ACCEPTED'}
            onClick={handleAccept}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {status === 'ACCEPTED' ? 'Déjà acceptée' : pending === 'accept' ? 'Validation…' : 'Accepter et notifier'}
          </button>
        </div>

        {feedback ? (
          <p className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
            {feedback}
          </p>
        ) : null}
      </aside>
    </div>
  );
}
