'use client';

import { useActionState, useState } from 'react';
import {
  createCoverLetterAction,
  deleteCoverLetterAction,
  updateCoverLetterAction,
  type CoverLetter,
  type CoverLetterFormState,
} from '@/app/dashboard/cover-letters/actions';
import { CheckCircle2, ChevronDown, ChevronUp, Edit2, FileText, Loader2, Plus, Star, Trash2 } from 'lucide-react';

const empty: CoverLetterFormState = {};

function CoverLetterForm({
  onClose,
  initial,
}: {
  onClose: () => void;
  initial?: CoverLetter;
}) {
  const action = initial
    ? updateCoverLetterAction.bind(null, initial.id)
    : createCoverLetterAction;

  const [state, formAction, pending] = useActionState(action, empty);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Titre *</label>
        <input
          name="title"
          required
          defaultValue={initial?.title}
          placeholder="Ex : Lettre pour poste développeur"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Contenu *</label>
        <textarea
          name="content"
          required
          rows={12}
          defaultValue={initial?.content}
          placeholder="Madame, Monsieur,&#10;&#10;C'est avec un vif intérêt que..."
          className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          name="isPrimary"
          defaultChecked={initial?.isPrimary ?? false}
          className="h-4 w-4 rounded accent-blue-600"
        />
        <span className="text-sm text-slate-700">
          Définir comme lettre de motivation principale
        </span>
      </label>

      {state.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{state.error}</p>
      )}
      {state.success && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">{state.success}</p>
      )}

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
          Annuler
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          {initial ? 'Enregistrer les modifications' : 'Créer la lettre'}
        </button>
      </div>
    </form>
  );
}

function CoverLetterCard({ cl }: { cl: CoverLetter }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await deleteCoverLetterAction(cl.id);
    setDeleting(false);
  }

  if (editing) {
    return (
      <div className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-serif text-sm font-semibold text-slate-900">Modifier : {cl.title}</h3>
        <CoverLetterForm initial={cl} onClose={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className={`rounded-3xl border bg-white p-5 shadow-sm transition ${cl.isPrimary ? 'border-purple-300' : 'border-slate-200'}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif text-sm font-semibold text-slate-900">{cl.title}</h3>
              {cl.isPrimary && (
                <span className="stamp stamp-pine">
                  <Star className="h-3 w-3" /> Principale
                </span>
              )}
            </div>
            <p className="docket">
              {new Date(cl.updatedAt).toLocaleDateString('fr-FR')} · {cl.content.length} caractères
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? 'Réduire' : 'Aperçu'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition"
          >
            <Edit2 className="h-3.5 w-3.5" /> Modifier
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition disabled:opacity-60"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <pre className="whitespace-pre-wrap text-xs text-slate-700 leading-relaxed font-sans">{cl.content}</pre>
        </div>
      )}
    </div>
  );
}

export function CoverLetterManager({ coverLetters }: { coverLetters: CoverLetter[] }) {
  const [showForm, setShowForm] = useState(coverLetters.length === 0);

  return (
    <div className="space-y-5">
      {/* Bouton créer */}
      {!showForm && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-purple-500/20 transition hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" /> Nouvelle lettre de motivation
          </button>
        </div>
      )}

      {/* Formulaire de création */}
      {showForm && (
        <div className="rounded-3xl border border-purple-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 font-serif text-base font-semibold text-slate-900">Nouvelle lettre de motivation</h2>
          <CoverLetterForm onClose={() => setShowForm(false)} />
        </div>
      )}

      {/* Liste */}
      {coverLetters.length === 0 && !showForm ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
            <FileText className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Aucune lettre de motivation</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              Créez votre première lettre ou utilisez la génération automatique lors d'une candidature.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-purple-700 transition"
          >
            <Plus className="h-4 w-4" /> Créer une lettre
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {coverLetters.map((cl) => <CoverLetterCard key={cl.id} cl={cl} />)}
        </div>
      )}
    </div>
  );
}
