import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { requireCurrentUser } from '@/lib/auth';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import { ApplyForm } from '@/components/apply-form';
import { getApplyPageData } from './actions';
import { generateCoverLetter } from '@/lib/coverLetterTemplate';
import { API_BASE_URL } from '@/lib/api';
import { cookies } from 'next/headers';
import { ArrowLeft, Briefcase, Building2, CalendarDays, MapPin } from 'lucide-react';

async function getCandidateProfileForLetter(token: string) {
  try {
    const [profileRes, skillsRes, expRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/profile`, { headers: { Cookie: `jobpilot_token=${token}` }, cache: 'no-store' }),
      fetch(`${API_BASE_URL}/api/profile/skills`, { headers: { Cookie: `jobpilot_token=${token}` }, cache: 'no-store' }),
      fetch(`${API_BASE_URL}/api/profile/experiences`, { headers: { Cookie: `jobpilot_token=${token}` }, cache: 'no-store' }),
    ]);
    const profile = profileRes.ok ? (await profileRes.json() as any).profile : null;
    const skills: {name: string}[] = skillsRes.ok ? (await skillsRes.json() as any).skills ?? [] : [];
    const experiences: any[] = expRes.ok ? (await expRes.json() as any).experiences ?? [] : [];
    return { profile, skills, experiences };
  } catch {
    return { profile: null, skills: [], experiences: [] };
  }
}

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCurrentUser();

  if (user.role !== 'CANDIDATE') {
    redirect('/dashboard');
  }

  const { id: jobId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('jobpilot_token')?.value ?? '';

  const [data, candidateData] = await Promise.all([
    getApplyPageData(jobId),
    getCandidateProfileForLetter(token),
  ]);

  if (!data) {
    notFound();
  }

  const { job, resumes, primaryResumeId, coverLetters } = data;

  // Génération automatique de la lettre si le candidat a un profil
  const generatedLetter =
    candidateData.profile
      ? generateCoverLetter({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profileTitle: candidateData.profile?.title,
          professionalSummary: candidateData.profile?.professionalSummary,
          yearsOfExperience: candidateData.profile?.yearsOfExperience,
          skills: candidateData.skills.map((s: { name: string }) => s.name),
          latestExperience: candidateData.experiences[0] ?? null,
          jobTitle: job.title,
          company: job.company,
          location: job.location,
        })
      : undefined;

  return (
    <main className="min-h-screen bg-slate-50/60 p-4 sm:p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <DashboardHeader user={user} />
        <DashboardNav role={user.role} />

        {/* Fil d'ariane */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/dashboard/jobs" className="hover:text-blue-600 transition">Offres disponibles</Link>
          <span>/</span>
          <Link href={`/dashboard/jobs/${jobId}`} className="hover:text-blue-600 transition truncate max-w-[180px]">{job.title}</Link>
          <span>/</span>
          <span className="font-semibold text-slate-700">Postuler</span>
        </div>

        {/* Récapitulatif de l'offre */}
        <section className="rounded-3xl border border-blue-200/80 bg-gradient-to-br from-blue-50 to-indigo-50/60 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/25">
              <Briefcase className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{job.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  {job.company}
                </span>
                {job.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {job.location}
                  </span>
                )}
                {job.postedAt && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    Publiée le {new Date(job.postedAt).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Formulaire de candidature */}
        {resumes.length === 0 ? (
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
            <p className="text-base font-bold text-amber-800">Aucun CV enregistré</p>
            <p className="mt-2 text-sm text-amber-700">
              Vous devez ajouter au moins un CV avant de postuler.
            </p>
            <Link
              href="/dashboard/resumes"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              Ajouter un CV →
            </Link>
          </div>
        ) : (
          <ApplyForm
            jobId={jobId}
            job={job}
            resumes={resumes}
            primaryResumeId={primaryResumeId}
            coverLetters={coverLetters}
            generatedLetter={generatedLetter}
          />
        )}

        <Link
          href={`/dashboard/jobs/${String(jobId)}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à la fiche de l'offre
        </Link>
      </div>
    </main>
  );
}
