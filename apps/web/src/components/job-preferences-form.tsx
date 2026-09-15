'use client';

import { useActionState, useState } from 'react';
import type {
  JobPreference,
  JobPreferenceFormState,
} from '@/app/dashboard/preferences/actions';
import {
  AlertCircle,
  Banknote,
  Briefcase,
  Building2,
  CheckCircle2,
  Globe2,
  Laptop,
  Loader2,
  MapPin,
  Save,
  SlidersHorizontal,
  Sparkles,
  Tag,
} from 'lucide-react';

interface JobPreferencesFormProps {
  preference: JobPreference | null;
  action: (
    state: JobPreferenceFormState,
    formData: FormData
  ) => Promise<JobPreferenceFormState>;
}

const initialState: JobPreferenceFormState = {};

function toTextareaValue(values: string[] | undefined): string {
  return values?.join(', ') ?? '';
}

function parseTags(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const suggestedTitles = [
  'Développeur Fullstack',
  'Frontend Engineer',
  'Backend Developer',
  'DevOps / SRE',
  'Product Manager',
  'Data Scientist',
];

const suggestedLocations = [
  'Paris',
  'Lyon',
  'Bordeaux',
  'Nantes',
  'Télétravail complet',
  'Hybride',
];

const suggestedContracts = ['CDI', 'Freelance / Indépendant', 'CDD', 'Alternance / Stage'];

const suggestedIndustries = [
  'SaaS & Logiciel',
  'Fintech',
  'Santé & MedTech',
  'Intelligence Artificielle',
  'E-commerce',
  'Impact & Climat',
];

export function JobPreferencesForm({
  preference,
  action,
}: JobPreferencesFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  const [jobTitles, setJobTitles] = useState(toTextareaValue(preference?.jobTitles));
  const [locations, setLocations] = useState(toTextareaValue(preference?.locations));
  const [contractTypes, setContractTypes] = useState(toTextareaValue(preference?.contractTypes));
  const [industries, setIndustries] = useState(toTextareaValue(preference?.industries));
  const [isRemote, setIsRemote] = useState(preference?.remote ?? false);
  const [minSalary, setMinSalary] = useState<string>(
    preference?.minSalary ? String(preference.minSalary) : ''
  );

  const addTagToField = (
    currentValue: string,
    setValue: (val: string) => void,
    tagToAdd: string
  ) => {
    const tags = parseTags(currentValue);
    if (!tags.includes(tagToAdd)) {
      const updated = tags.length > 0 ? `${currentValue.trim()}, ${tagToAdd}` : tagToAdd;
      setValue(updated);
    }
  };

  const activeJobTags = parseTags(jobTitles);
  const activeLocationTags = parseTags(locations);
  const activeContractTags = parseTags(contractTypes);
  const activeIndustryTags = parseTags(industries);

  const parsedSalary = Number(minSalary);
  const monthlySalary = !isNaN(parsedSalary) && parsedSalary > 0
    ? Math.round(parsedSalary / 12)
    : null;

  return (
    <form action={formAction} className="space-y-6">
      {/* Section 1: Postes cibles */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Briefcase className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-serif text-base font-semibold text-slate-900">Postes & Métiers Cibles</h2>
            <p className="text-xs text-slate-500">
              Séparez chaque intitulé par une virgule pour que l'IA détecte précisément vos opportunités.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <textarea
            name="jobTitles"
            rows={2}
            value={jobTitles}
            onChange={(e) => setJobTitles(e.target.value)}
            placeholder="Ex: Lead Developer React, Développeur Full Stack, Staff Engineer..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
          />

          {/* Live Tag preview */}
          {activeJobTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-medium text-slate-400">Tags actifs :</span>
              {activeJobTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div>
            <span className="text-[11px] font-medium text-slate-500">Ajout rapide suggéré :</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {suggestedTitles.map((title) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => addTagToField(jobTitles, setJobTitles, title)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 transition"
                >
                  + {title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Localisation & Télétravail */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-serif text-base font-semibold text-slate-900">Localisation & Modalités de travail</h2>
            <p className="text-xs text-slate-500">Précisez vos zones géographiques et votre ouverture au remote.</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Villes ou pays souhaités (séparés par une virgule)
            </label>
            <input
              name="locations"
              value={locations}
              onChange={(e) => setLocations(e.target.value)}
              placeholder="Ex: Paris, Lyon, Remote France, Suisse, Londres..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />

            {/* Live Location tags */}
            {activeLocationTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-medium text-slate-400">Zones sélectionnées :</span>
                {activeLocationTags.map((loc) => (
                  <span
                    key={loc}
                    className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/60"
                  >
                    📍 {loc}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {suggestedLocations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => addTagToField(locations, setLocations, loc)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-emerald-300 hover:text-emerald-700 transition"
                >
                  + {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Remote work toggle */}
          <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Laptop className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-900">
                    Ouvert aux offres en télétravail (Remote)
                  </span>
                  <p className="text-xs text-slate-500">
                    Inclure les offres en full-remote ou hybride partiel dans vos recommandations.
                  </p>
                </div>
              </div>
              <input
                name="remote"
                type="checkbox"
                checked={isRemote}
                onChange={(e) => setIsRemote(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Section 3: Rémunération minimale */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Banknote className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-serif text-base font-semibold text-slate-900">Rémunération minimale souhaitée</h2>
            <p className="text-xs text-slate-500">Filtrera les offres qui ne correspondent pas à vos attentes financières.</p>
          </div>
        </div>

        <div className="mt-6 max-w-sm space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Salaire brut annuel (€)
          </label>
          <div className="relative flex items-center">
            <input
              name="minSalary"
              type="number"
              min="0"
              step="1000"
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              placeholder="Ex: 55000"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-3.5 pr-12 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
            <span className="pointer-events-none absolute right-3.5 text-xs font-bold text-slate-400">
              € / an
            </span>
          </div>

          {monthlySalary && (
            <p className="text-xs font-medium text-emerald-600">
              Soit environ <strong className="font-bold">{monthlySalary.toLocaleString()} €</strong> brut / mois
            </p>
          )}
        </div>
      </div>

      {/* Section 4: Contrats & Secteurs */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-serif text-base font-semibold text-slate-900">Types de contrat & Secteurs d'activité</h2>
            <p className="text-xs text-slate-500">Ciblez les environnements et structures dans lesquels vous souhaitez évoluer.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Contracts */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Types de contrat visés
            </label>
            <input
              name="contractTypes"
              value={contractTypes}
              onChange={(e) => setContractTypes(e.target.value)}
              placeholder="Ex: CDI, Freelance, CDD..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {suggestedContracts.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => addTagToField(contractTypes, setContractTypes, c)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 hover:border-purple-300 hover:text-purple-600 transition"
                >
                  + {c}
                </button>
              ))}
            </div>
          </div>

          {/* Industries */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Industries & Secteurs
            </label>
            <input
              name="industries"
              value={industries}
              onChange={(e) => setIndustries(e.target.value)}
              placeholder="Ex: SaaS, FinTech, Santé, IA..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {suggestedIndustries.map((ind) => (
                <button
                  key={ind}
                  type="button"
                  onClick={() => addTagToField(industries, setIndustries, ind)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 hover:border-purple-300 hover:text-purple-600 transition"
                >
                  + {ind}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
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
              <span>Sauvegarde en cours...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Enregistrer mes préférences</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
