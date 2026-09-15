'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import type { AuthFormState } from '@/app/actions';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Loader2,
  Mail,
  Phone,
  Sparkles,
  User,
} from 'lucide-react';

interface AuthFieldOption {
  value: string;
  label: string;
}

interface AuthField {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  options?: AuthFieldOption[];
  defaultValue?: string;
}

interface AuthFormProps {
  title: string;
  description: string;
  submitLabel: string;
  alternateLabel: string;
  alternateHref: string;
  alternateText: string;
  fields: AuthField[];
  action: (
    state: AuthFormState,
    formData: FormData
  ) => Promise<AuthFormState>;
}

const initialState: AuthFormState = {};

function getFieldIcon(name: string, type?: string) {
  if (type === 'email' || name.toLowerCase().includes('email')) {
    return <Mail className="h-4 w-4 text-slate-400" />;
  }
  if (type === 'password' || name.toLowerCase().includes('password')) {
    return <Lock className="h-4 w-4 text-slate-400" />;
  }
  if (type === 'tel' || name.toLowerCase().includes('phone')) {
    return <Phone className="h-4 w-4 text-slate-400" />;
  }
  return <User className="h-4 w-4 text-slate-400" />;
}

export function AuthForm({
  title,
  description,
  submitLabel,
  alternateLabel,
  alternateHref,
  alternateText,
  fields,
  action,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50">
      <div className="mb-8 text-center">
        <Link href="/welcome" className="inline-flex items-center gap-2 mb-4 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 transition group-hover:scale-105">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">JobPilot</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1.5 text-sm text-slate-500">{description}</p>
      </div>

      <form action={formAction} className="space-y-4">
        {fields.map((field) => {
          const isPasswordField = field.type === 'password';
          const isVisible = showPasswords[field.name];
          const inputType = isPasswordField ? (isVisible ? 'text' : 'password') : (field.type ?? 'text');

          return (
            <div key={field.name} className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                {field.label}
              </label>
              <div className="relative flex items-center">
                <div className="pointer-events-none absolute left-3 flex items-center">
                  {getFieldIcon(field.name, field.type)}
                </div>
                {field.options ? (
                  <select
                    name={field.name}
                    defaultValue={field.defaultValue}
                    required={field.required ?? true}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  >
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    name={field.name}
                    type={inputType}
                    autoComplete={field.autoComplete}
                    defaultValue={field.defaultValue}
                    required={field.required ?? true}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                )}
                {isPasswordField ? (
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(field.name)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 transition"
                    tabIndex={-1}
                    aria-label={isVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}

        {state.error ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{state.error}</span>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 font-semibold text-white shadow-md shadow-blue-500/20 transition hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Veuillez patienter...</span>
            </>
          ) : (
            submitLabel
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
        {alternateLabel}{' '}
        <Link href={alternateHref} className="font-semibold text-blue-600 hover:text-blue-700 transition underline-offset-4 hover:underline">
          {alternateText}
        </Link>
      </div>
    </div>
  );
}
