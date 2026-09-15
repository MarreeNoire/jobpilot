'use client';

import { useActionState, useState } from 'react';
import type { Profile, ProfileFormState } from '@/app/dashboard/profile/actions';
import {
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Save,
  Sparkles,
} from 'lucide-react';

interface ProfileFormProps {
  profile: Profile | null;
  action: (
    state: ProfileFormState,
    formData: FormData
  ) => Promise<ProfileFormState>;
}

const initialState: ProfileFormState = {};

const availabilityOptions = [
  'Immédiate',
  '1 mois de préavis',
  '3 mois de préavis',
  'En poste — À l\'écoute',
];

export function ProfileForm({ profile, action }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [availability, setAvailability] = useState(profile?.availability ?? '');
  const [summary, setSummary] = useState(profile?.professionalSummary ?? '');

  return (
    <form action={formAction} className="space-y-6">
      {/* Section 1: Rôle & Expérience */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Briefcase className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Rôle & Niveau d'expérience</h2>
            <p className="text-xs text-slate-500">Ces informations qualifient votre profil pour le moteur de matching.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Titre ou métier visé
            </label>
            <input
              name="title"
              defaultValue={profile?.title ?? ''}
              placeholder="Ex: Développeur Fullstack TypeScript / React"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
            <p className="text-[11px] text-slate-400">Ex: Développeur Web, Product Manager, Data Engineer</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Années d'expérience professionnelle
            </label>
            <input
              name="yearsOfExperience"
              type="number"
              min="0"
              max="50"
              defaultValue={profile?.yearsOfExperience ?? ''}
              placeholder="Ex: 4"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
            <p className="text-[11px] text-slate-400">Total cumulé dans votre domaine d'activité</p>
          </div>
        </div>
      </div>

      {/* Section 2: Disponibilité */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Disponibilité</h2>
            <p className="text-xs text-slate-500">Précisez votre délai de prise de poste pour les recruteurs.</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Statut de disponibilité
            </label>
            <input
              name="availability"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              placeholder="Ex: Immédiate, Préavis 1 mois, Début octobre 2026..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-500">Suggestions rapides :</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {availabilityOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAvailability(opt)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                    availability === opt
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Pitch & Résumé Professionnel */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Résumé professionnel / Pitch</h2>
              <p className="text-xs text-slate-500">Synthèse de votre parcours utilisée par l'IA pour vos candidatures.</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">{summary.length} caractères</span>
        </div>

        <div className="mt-6 space-y-3">
          <div className="relative">
            <textarea
              name="professionalSummary"
              rows={6}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Présentez vos points forts, réalisations marquantes, technologies maîtrisées et le type de défis que vous recherchez..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900">
            <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              <strong className="font-semibold">Conseil IA :</strong> Mentionnez vos expertises techniques concrètes (ex: architecture cloud, refonte UI, management agile, volume de trafic géré) pour maximiser les scores de correspondance.
            </p>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {state.error ? (
        <div className="flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      {state.success ? (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{state.success}</span>
        </div>
      ) : null}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Enregistrement en cours...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Enregistrer mon profil</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
