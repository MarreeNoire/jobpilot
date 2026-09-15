'use client';

import { useActionState, useState } from 'react';
import { submitApplicationAction } from '@/app/dashboard/jobs/[id]/apply/actions';
import type { ApplyFormState, CoverLetter } from '@/app/dashboard/jobs/[id]/apply/actions';
import type { Job } from '@/app/dashboard/jobs/actions';
import type { Resume } from '@/app/dashboard/resumes/actions';
import { FileText, Loader2, Send, Sparkles } from 'lucide-react';

interface ApplyFormProps {
  jobId: string;
  job: Pick<Job, 'title' | 'company' | 'location'>;
  resumes: Resume[];
  primaryResumeId: string | null;
  coverLetters: CoverLetter[];
  generatedLetter?: string;
}

const initialState: ApplyFormState = {};

export function ApplyForm({ jobId, job, resumes, primaryResumeId, coverLetters, generatedLetter }: ApplyFormProps) {
  const [state, formAction, pending] = useActionState(submitApplicationAction, initialState);
  const [letterText, setLetterText] = useState(generatedLetter ?? '');
  const [showLetterEditor, setShowLetterEditor] = useState(Boolean(generatedLetter));
  const [savingLetter, setSavingLetter] = useState(false);
  const [savedLetter, setSavedLetter] = useState<string | null>(null);

  async function handleSaveLetter() {
    if (!letterText.trim()) return;
    setSavingLetter(true);
    try {
      const fd = new FormData();
      fd.set('title', `Lettre — ${job.title} chez ${job.company}`);
      fd.set('content', letterText);
      const res = await fetch('/api/save-cover-letter', { method: 'POST', body: fd });
      if (res.ok) setSavedLetter('Lettre sauvegardée dans vos documents.');
    } catch {
      // silently ignore
    } finally {
      setSavingLetter(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Votre candidature</h2>
        <p className="mt-1 text-sm text-slate-500">
          Sélectionnez votre CV et, si vous le souhaitez, une lettre de motivation.
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        {/* Champ caché : jobId */}
        <input type="hidden" name="jobId" value={jobId} />

        {/* Sélection du CV */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            CV <span className="text-red-400">*</span>
          </label>
          <div className="space-y-2">
            {resumes.map((resume) => (
              <label
                key={resume.id}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/40 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50/60"
              >
                <input
                  type="radio"
                  name="resumeId"
                  value={resume.id}
                  defaultChecked={resume.id === primaryResumeId}
                  className="h-4 w-4 accent-blue-600"
                />
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{resume.title}</p>
                    {resume.fileName && (
                      <p className="truncate text-xs text-slate-500">{resume.fileName}</p>
                    )}
                  </div>
                  {resume.isPrimary && (
                    <span className="ml-auto shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                      Principal
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Lettre de motivation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Lettre de motivation <span className="font-normal normal-case text-slate-400">(optionnel)</span>
            </label>
            {!showLetterEditor && (
              <button
                type="button"
                onClick={() => setShowLetterEditor(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1 text-[11px] font-semibold text-purple-700 hover:bg-purple-100 transition"
              >
                <Sparkles className="h-3 w-3" />
                {generatedLetter ? 'Voir la lettre générée' : 'Rédiger une lettre'}
              </button>
            )}
          </div>

          {!showLetterEditor && coverLetters.length > 0 && (
            <select
              name="coverLetterId"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">— Aucune lettre de motivation —</option>
              {coverLetters.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {cl.title}{cl.isPrimary ? ' (principale)' : ''}
                </option>
              ))}
            </select>
          )}

          {showLetterEditor && (
            <div className="space-y-2 rounded-2xl border border-purple-200 bg-purple-50/30 p-4">
              {generatedLetter && (
                <p className="text-[11px] text-purple-700 font-semibold">
                  ✨ Lettre générée automatiquement — vous pouvez la modifier avant envoi.
                </p>
              )}
              <textarea
                name="coverLetterText"
                value={letterText}
                onChange={(e) => setLetterText(e.target.value)}
                rows={12}
                className="w-full resize-y rounded-xl border border-purple-200 bg-white p-3.5 text-sm text-slate-900 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLetterEditor(false)}
                  className="text-[11px] text-slate-500 hover:text-slate-700 transition"
                >
                  Masquer
                </button>
                {savedLetter && (
                  <span className="text-[11px] text-emerald-600">{savedLetter}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Message d'erreur */}
        {state.error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        {/* Bouton de soumission */}
        <div className="border-t border-slate-100 pt-4">
          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Envoi en cours…</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Envoyer ma candidature</span>
              </>
            )}
          </button>
          <p className="mt-2.5 text-center text-xs text-slate-400">
            En soumettant, le recruteur sera notifié par email et pourra consulter votre profil complet.
          </p>
        </div>
      </form>
    </section>
  );
}
