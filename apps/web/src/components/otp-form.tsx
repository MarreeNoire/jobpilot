'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { requestOtpAction, verifyOtpAction } from '@/app/actions';
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Mail } from 'lucide-react';

interface OtpFormProps {
  role: 'CANDIDATE' | 'RECRUITER';
}

export function OtpForm({ role }: OtpFormProps) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleRequest(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await requestOtpAction(email, role);
      if (result.error) {
        setError(result.error);
        return;
      }
      setStep('code');
    });
  }

  function handleVerify(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await verifyOtpAction(email, code);
      if (result?.error) {
        setError(result.error);
      }
      // En cas de succes, verifyOtpAction redirige lui-meme (server action).
    });
  }

  if (step === 'code') {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Code envoyé à {email}. Vérifiez votre boîte mail (et vos spams).</span>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Code à 6 chiffres
          </label>
          <div className="relative flex items-center">
            <div className="pointer-events-none absolute left-3">
              <KeyRound className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3 text-center text-lg font-bold tracking-[0.3em] text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>

        {error ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 font-semibold text-white shadow-md shadow-blue-500/20 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Vérification...</span>
            </>
          ) : (
            'Valider le code'
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setStep('email');
            setError(null);
            setCode('');
          }}
          className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-700 transition"
        >
          Changer d&apos;adresse email
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleRequest} className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
          Adresse email
        </label>
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute left-3">
            <Mail className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
          />
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white shadow-md transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Envoi...</span>
          </>
        ) : (
          'Recevoir un code par email'
        )}
      </button>
    </form>
  );
}
