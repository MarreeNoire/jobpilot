import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { requireCurrentUser } from '@/lib/auth';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import { RecruiterActionsPanel } from '@/components/recruiter-actions-panel';
import { getApplicationDetail, type RecruiterApplicationDetail } from '../actions';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  FileText,
  GraduationCap,
  History,
  Mail,
  MapPin,
  Phone,
  Star,
  User,
} from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT:                { label: 'Brouillon',           color: 'bg-slate-100 text-slate-700' },
  PENDING:              { label: 'En attente',           color: 'bg-slate-100 text-slate-700' },
  PROCESSING:           { label: 'Traitement en cours',  color: 'bg-slate-100 text-slate-700' },
  WAITING_USER:         { label: 'Action requise',       color: 'bg-slate-100 text-slate-700' },
  SUBMITTED:            { label: 'Soumise',              color: 'bg-slate-100 text-slate-700' },
  REVIEWING:            { label: 'En examen',             color: 'bg-blue-100 text-blue-700' },
  SHORTLISTED:          { label: 'Présélectionné(e)',    color: 'bg-indigo-100 text-indigo-700' },
  INTERVIEW_SCHEDULED:  { label: 'Entretien planifié',   color: 'bg-amber-100 text-amber-700' },
  INTERVIEW:            { label: 'Entretien',             color: 'bg-amber-100 text-amber-700' },
  FAILED:               { label: 'Échec',                color: 'bg-red-100 text-red-600' },
  ACCEPTED:             { label: 'Accepté(e)',            color: 'bg-emerald-100 text-emerald-700' },
  REJECTED:             { label: 'Non retenu(e)',         color: 'bg-red-100 text-red-600' },
};

function activitySummary(activity: RecruiterApplicationDetail['activities'][number]): string {
  if (activity.type === 'STATUS_CHANGED') {
    const from = activity.fromStatus ? (STATUS_LABELS[activity.fromStatus]?.label ?? activity.fromStatus) : '—';
    const to = activity.toStatus ? (STATUS_LABELS[activity.toStatus]?.label ?? activity.toStatus) : '—';
    return `Statut : ${from} → ${to}`;
  }

  if (activity.type === 'INTERVIEW_SCHEDULED') {
    const scheduledAt = activity.details?.scheduledAt;
    if (typeof scheduledAt === 'string') {
      const date = new Date(scheduledAt);
      if (!Number.isNaN(date.getTime())) {
        return `Entretien planifié pour le ${date.toLocaleString('fr-FR', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}`;
      }
    }
    return 'Entretien planifié';
  }

  return 'Note interne mise à jour';
}

function activityDate(value: string): string {
  return new Date(value).toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
}

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string; applicationId: string }>;
}) {
  const user = await requireCurrentUser();

  if (user.role !== 'RECRUITER') {
    redirect('/dashboard');
  }

  const { id: jobId, applicationId } = await params;
  const application = await getApplicationDetail(applicationId);

  if (!application) {
    notFound();
  }

  const { candidate, resume, coverLetter } = application;
  const initials = `${candidate.firstName[0] ?? ''}${candidate.lastName[0] ?? ''}`.toUpperCase();
  const statusInfo = STATUS_LABELS[application.status] ?? { label: application.status, color: 'bg-slate-100 text-slate-700' };

  return (
    <main className="min-h-screen bg-slate-50/60 p-4 sm:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <DashboardHeader user={user} />
        <DashboardNav role={user.role} />

        {/* Nav fil d'ariane */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/dashboard/jobs" className="hover:text-blue-600 transition">Mes offres</Link>
          <span>/</span>
          <Link href={`/dashboard/jobs/${jobId}/applications`} className="hover:text-blue-600 transition">
            {application.job.title}
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-700">{candidate.firstName} {candidate.lastName}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

          {/* ─── Colonne gauche : profil candidat ─── */}
          <div className="flex flex-col gap-5">

            {/* Carte identité */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-jobpilot-primary to-jobpilot-cvs text-2xl font-bold text-white shadow-md">
                    {initials}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                      {candidate.firstName} {candidate.lastName}
                    </h1>
                    {candidate.profile?.title && (
                      <p className="text-sm font-medium text-slate-600">{candidate.profile.title}</p>
                    )}
                    <span className={`mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{candidate.email}</span>
                  {candidate.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{candidate.phone}</span>}
                  {candidate.profile?.availability && (
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Dispo : {candidate.profile.availability}</span>
                  )}
                  {candidate.profile?.yearsOfExperience != null && (
                    <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5" />{candidate.profile.yearsOfExperience} an(s) d'expérience</span>
                  )}
                </div>
              </div>

              {candidate.profile?.professionalSummary && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Résumé professionnel</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{candidate.profile.professionalSummary}</p>
                </div>
              )}
            </section>

            {/* Historique de la candidature */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                <History className="h-4 w-4 text-indigo-500" />
                Historique
              </h2>
              {application.activities.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune activité enregistrée.</p>
              ) : (
                <div className="relative space-y-4 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-slate-200">
                  {application.activities.map((activity) => (
                    <div key={activity.id} className="relative flex gap-3 pl-1">
                      <span className="z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 border-white bg-indigo-500 ring-1 ring-indigo-200" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800">{activitySummary(activity)}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {activityDate(activity.createdAt)}
                          {activity.actor
                            ? ` · ${activity.actor.firstName} ${activity.actor.lastName}`
                            : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Compétences */}
            {candidate.skills.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                  <Star className="h-4 w-4 text-amber-500" />
                  Compétences
                </h2>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill) => (
                    <span
                      key={skill.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      {skill.name}
                      {skill.level != null && (
                        <span className="ml-1 text-slate-400">{'★'.repeat(skill.level)}</span>
                      )}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Expériences */}
            {candidate.experiences.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                  <Briefcase className="h-4 w-4 text-blue-500" />
                  Expériences professionnelles
                </h2>
                <div className="space-y-5">
                  {candidate.experiences.map((exp) => (
                    <div key={exp.id} className="flex gap-3">
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{exp.position}</p>
                        <p className="text-sm text-slate-600">{exp.company}</p>
                        <p className="text-xs text-slate-400">
                          {formatDate(exp.startDate)} → {exp.endDate ? formatDate(exp.endDate) : 'En poste'}
                        </p>
                        {exp.description && (
                          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Formations */}
            {candidate.educations.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                  <GraduationCap className="h-4 w-4 text-indigo-500" />
                  Formation
                </h2>
                <div className="space-y-4">
                  {candidate.educations.map((edu) => (
                    <div key={edu.id} className="flex gap-3">
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{edu.degree}</p>
                        {edu.fieldOfStudy && <p className="text-sm text-slate-600">{edu.fieldOfStudy}</p>}
                        <p className="text-sm text-slate-600">{edu.institution}</p>
                        <p className="text-xs text-slate-400">
                          {formatDate(edu.startDate)} → {edu.endDate ? formatDate(edu.endDate) : 'En cours'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* CV joint */}
            {resume && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                  <FileText className="h-4 w-4 text-emerald-500" />
                  CV joint
                </h2>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{resume.title}</p>
                    {resume.fileName && <p className="text-xs text-slate-500">{resume.fileName}</p>}
                  </div>
                  {resume.fileUrl && (
                    <a
                      href={resume.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                    >
                      Télécharger
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* Lettre de motivation */}
            {coverLetter && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                  <FileText className="h-4 w-4 text-purple-500" />
                  Lettre de motivation
                </h2>
                <p className="text-sm font-medium text-slate-700 mb-3">{coverLetter.title}</p>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {coverLetter.content}
                </div>
              </section>
            )}
          </div>

          {/* ─── Colonne droite : actions recruteur ─── */}
          <div className="flex flex-col gap-5">
            <Link
              href={`/dashboard/jobs/${jobId}/applications`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour au pipeline
            </Link>

            <RecruiterActionsPanel
              jobId={jobId}
              applicationId={applicationId}
              currentStatus={application.status}
              recruiterNotes={application.recruiterNotes}
              hiringMessage={application.hiringMessage}
              interviews={application.interviews}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
