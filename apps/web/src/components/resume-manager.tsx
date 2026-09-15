'use client';

import { useActionState, useState } from 'react';
import type { Resume, ResumeFormState } from '@/app/dashboard/resumes/actions';
import {
  createResumeAction,
  deleteResumeAction,
  setPrimaryResumeAction,
} from '@/app/dashboard/resumes/actions';
import { PdfViewerModal } from '@/components/pdf-viewer-modal';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  FilePlus2,
  FileText,
  Globe,
  Loader2,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';

interface ResumeManagerProps {
  resumes: Resume[];
}

const initialState: ResumeFormState = {};

const quickTitles = [
  'CV Développeur Fullstack',
  'CV Lead Tech / Architecte',
  'CV Anglais — International',
  'CV Frontend Spécialisé',
];

export function ResumeManager({ resumes }: ResumeManagerProps) {
  const [state, formAction, pending] = useActionState(createResumeAction, initialState);
  const [titleInput, setTitleInput] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);
  const [hiddenDeleteIds, setHiddenDeleteIds] = useState<string[]>([]);
  const [hiddenPrimaryIds, setHiddenPrimaryIds] = useState<string[]>([]);

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce CV ?')) {
      setDeletingId(id);
      try {
        await deleteResumeAction(id);
        setHiddenDeleteIds((current) => [...current, id]);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleSetPrimary = async (id: string) => {
    setSettingPrimaryId(id);
    try {
      await setPrimaryResumeAction(id);
      setHiddenPrimaryIds((current) => [...current, id]);
    } finally {
      setSettingPrimaryId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Form to Add a New Resume */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FilePlus2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-serif text-base font-semibold text-slate-900">Ajouter une variante de CV</h2>
            <p className="text-xs text-slate-500">
              Renseignez le lien public ou sécurisé vers votre CV (Google Drive, Dropbox, Notion, Cloud...).
            </p>
          </div>
        </div>

        <form action={formAction} className="mt-6 space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Titre du CV *
              </label>
              <input
                name="title"
                required
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="Ex: CV Fullstack TypeScript 2026"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickTitles.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTitleInput(t)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 hover:border-blue-300 hover:text-blue-600 transition"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                URL du fichier ou document
              </label>
              <div className="relative flex items-center">
                <div className="pointer-events-none absolute left-3 flex items-center">
                  <Globe className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  name="fileUrl"
                  type="url"
                  placeholder="https://mon-stockage.com/cv.pdf"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Optionnel. Vous pouvez soit coller un lien, soit importer un fichier depuis votre appareil.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Importer un fichier
              </label>
              <input
                name="file"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name ?? '')}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-[11px] text-slate-400">
                {selectedFileName ? `Fichier sélectionné : ${selectedFileName}` : 'Aucun fichier sélectionné.'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                name="isPrimary"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <span className="text-sm font-semibold text-slate-900">
                  Définir comme CV principal par défaut
                </span>
                <p className="text-xs text-slate-500">
                  Ce document sera sélectionné en priorité pour la génération automatique de vos candidatures.
                </p>
              </div>
            </label>
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

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Ajouter ce CV</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Saved Resumes List */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-serif text-base font-semibold text-slate-900">CVs enregistrés</h2>
            <p className="text-xs text-slate-500">Gérez vos versions et activez le CV de référence.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {resumes.length} document{resumes.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="mt-6">
          {resumes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-800">Aucun CV enregistré pour le moment</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                Ajoutez au moins un CV ci-dessus via un lien ou un fichier local pour permettre l’analyse de compatibilité avec les offres d’emploi.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                    resume.isPrimary
                      ? 'border-blue-400/80 bg-gradient-to-br from-blue-50/60 to-indigo-50/30 shadow-md shadow-blue-500/5 ring-1 ring-blue-400/30'
                      : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          resume.isPrimary ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 leading-snug">{resume.title}</h3>
                          <span className="docket">
                            ID: {resume.id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>

                      {resume.isPrimary ? (
                        <span className="stamp stamp-green">
                          <Star className="h-3 w-3" />
                          <span>Principal</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      {resume.fileUrl ? (
                        <a
                          href={resume.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 truncate max-w-[220px]"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{resume.fileUrl}</span>
                        </a>
                      ) : resume.hasUploadedFile ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <FileCheck className="h-3.5 w-3.5 shrink-0" />
                          <span>Fichier importé : {resume.fileName ?? 'document local'}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Aucun lien ni fichier enregistré</span>
                      )}

                      <PdfViewerModal
                        title={resume.title}
                        fileUrl={resume.fileUrl}
                        fileContent={resume.fileContent}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-200/60 pt-3">
                    <div>
                      {!resume.isPrimary && !hiddenPrimaryIds.includes(resume.id) ? (
                        <button
                          type="button"
                          disabled={settingPrimaryId === resume.id}
                          onClick={() => handleSetPrimary(resume.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-blue-600 transition disabled:opacity-50"
                        >
                          {settingPrimaryId === resume.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Star className="h-3.5 w-3.5" />
                          )}
                          <span>Définir comme principal</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <FileCheck className="h-3.5 w-3.5" />
                          <span>Sélectionné par défaut</span>
                        </span>
                      )}
                    </div>

                    {!hiddenDeleteIds.includes(resume.id) ? (
                      <button
                        type="button"
                        disabled={deletingId === resume.id}
                        onClick={() => handleDelete(resume.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-600 transition disabled:opacity-50"
                        title="Supprimer ce CV"
                      >
                        {deletingId === resume.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        <span>Supprimer</span>
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600">Suppression effectuée</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
