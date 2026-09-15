'use client';

import { useActionState, useState, useTransition } from 'react';
import { createAutomationRuleAction, deleteAutomationRuleAction, toggleAutoApplyAction, type AutomationRule, type AutomationFormState } from '@/app/dashboard/automation/actions';
import type { Resume } from '@/app/dashboard/resumes/actions';
import type { CoverLetter } from '@/app/dashboard/cover-letters/actions';
import { CheckCircle2, Loader2, Plus, Trash2, Zap, ZapOff } from 'lucide-react';

const CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Freelance', 'Interim'];
const empty: AutomationFormState = {};

function RuleCard({ rule, onDelete, onToggle }: {
  rule: AutomationRule;
  onDelete: (id: string) => void;
  onToggle: (id: string, v: boolean) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  return (
    <div className={`rounded-3xl border bg-white p-5 shadow-sm transition ${rule.autoApply ? 'border-amber-300' : 'border-slate-200'}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            {rule.autoApply
              ? <Zap className="h-4 w-4 text-amber-500" />
              : <ZapOff className="h-4 w-4 text-slate-400" />}
            <h3 className="text-sm font-bold text-slate-900">{rule.name}</h3>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${rule.autoApply ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
              {rule.autoApply ? 'Auto-candidature ON' : 'Auto-candidature OFF'}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {rule.keywords.map((k) => (
              <span key={k} className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">#{k}</span>
            ))}
            {rule.locations.map((l) => (
              <span key={l} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">📍{l}</span>
            ))}
            {rule.contractTypes.map((c) => (
              <span key={c} className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-700">{c}</span>
            ))}
            {rule.minScore && (
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">≥{rule.minScore}% match</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={toggling}
            onClick={async () => {
              setToggling(true);
              await onToggle(rule.id, !rule.autoApply);
              setToggling(false);
            }}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-60 ${
              rule.autoApply
                ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
            }`}
          >
            {toggling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (rule.autoApply ? 'Désactiver' : 'Activer')}
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={async () => { setDeleting(true); await onDelete(rule.id); setDeleting(false); }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition disabled:opacity-60"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

interface AutomationManagerProps {
  rules: AutomationRule[];
  resumes: Resume[];
  coverLetters: CoverLetter[];
}

export function AutomationManager({ rules, resumes, coverLetters }: AutomationManagerProps) {
  const [showForm, setShowForm] = useState(rules.length === 0);
  const [state, formAction, pending] = useActionState(createAutomationRuleAction, empty);
  const [, startTransition] = useTransition();

  function handleDelete(id: string) {
    return startTransition(async () => { await deleteAutomationRuleAction(id); });
  }

  function handleToggle(id: string, v: boolean) {
    return startTransition(async () => { await toggleAutoApplyAction(id, v); });
  }

  return (
    <div className="space-y-5">
      {!showForm && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-amber-600 transition"
          >
            <Plus className="h-4 w-4" /> Nouvelle règle d'automatisation
          </button>
        </div>
      )}

      {showForm && (
        <div className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-base font-bold text-slate-900">Nouvelle règle</h2>
          <form action={formAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Nom de la règle *</label>
                <input name="name" required placeholder="Ex: CDI Informatique Abidjan" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Mots-clés (séparés par virgule)</label>
                <input name="keywords" placeholder="développeur, react, informatique" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Localisations (séparées par virgule)</label>
                <input name="locations" placeholder="Abidjan, Dakar, Remote" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Types de contrat</label>
                <div className="flex flex-wrap gap-2">
                  {CONTRACT_TYPES.map((ct) => (
                    <label key={ct} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" name="contractTypes" value={ct} className="accent-amber-500" />
                      <span className="text-xs font-semibold text-slate-700">{ct}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Score minimum (%)</label>
                <input name="minScore" type="number" min="0" max="100" step="5" placeholder="75" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
              </div>

              {resumes.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">CV à utiliser</label>
                  <select name="resumeId" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100">
                    <option value="">CV principal automatique</option>
                    {resumes.map((r) => <option key={r.id} value={r.id}>{r.title}{r.isPrimary ? ' (principal)' : ''}</option>)}
                  </select>
                </div>
              )}

              {coverLetters.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Lettre de motivation</label>
                  <select name="coverLetterId" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100">
                    <option value="">Générer automatiquement</option>
                    {coverLetters.map((cl) => <option key={cl.id} value={cl.id}>{cl.title}{cl.isPrimary ? ' (principale)' : ''}</option>)}
                  </select>
                </div>
              )}
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
              <input type="checkbox" name="autoApply" className="h-4 w-4 accent-amber-500" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Activer l'auto-candidature</p>
                <p className="text-xs text-amber-700">Le système postulera automatiquement dès qu'une offre correspond à cette règle.</p>
              </div>
            </label>

            {state.error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{state.error}</p>}
            {state.success && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">{state.success}</p>}

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">Annuler</button>
              <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-amber-600 transition disabled:opacity-60">
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Créer la règle
              </button>
            </div>
          </form>
        </div>
      )}

      {rules.length === 0 && !showForm ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
            <Zap className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Aucune règle d'automatisation</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">Créez votre première règle pour activer le mode pilote automatique.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
