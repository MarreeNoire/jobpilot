import { AuthForm } from '@/components/auth-form';
import { AlternateAuthMethods } from '@/components/alternate-auth-methods';
import { ActiveSessionBanner } from '@/components/active-session-banner';
import { registerAction } from '@/app/actions';
import { getCurrentUser } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, Trophy } from 'lucide-react';

type RegisterSearchParams = Promise<{ role?: string }>;

function resolveRole(role?: string): 'CANDIDATE' | 'RECRUITER' | 'ADMIN' {
  if (role === 'ADMIN' && process.env.NODE_ENV === 'development') {
    return 'ADMIN';
  }
  return role === 'RECRUITER' ? 'RECRUITER' : 'CANDIDATE';
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: RegisterSearchParams;
}) {
  // On ne redirige plus automatiquement si une session existe deja : un
  // utilisateur connecte en tant que candidat doit pouvoir creer un
  // compte recruteur (et inversement) sans etre bloque avant meme
  // d'avoir pu remplir le formulaire.
  const currentUser = await getCurrentUser();

  const { role } = await searchParams;
  const selectedRole = resolveRole(role);
  const isRecruiter = selectedRole === 'RECRUITER';

  return (
    <main className="flex min-h-screen bg-slate-50">
      {/* Left branding banner (visible on lg screens) */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,theme(colors.blue.500/20),transparent)]" />

        <div className="relative z-10">
          <Link href="/welcome" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition">
            <ArrowLeft className="h-4 w-4" />
            <span>Retour à l'accueil</span>
          </Link>
          <div className="mt-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight">JobPilot</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span>Votre avantage concurrentiel</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Préparez des candidatures percutantes dès aujourd'hui.
          </h2>
          <div className="space-y-3 pt-2 text-sm text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Configurez vos critères cibles (titres, salaires, remote)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Gérez plusieurs variantes de CV adaptées à chaque rôle</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Sécurité et confidentialité totales de vos informations</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 border-t border-slate-800 pt-6 text-xs text-slate-400">
          JobPilot © 2026 — Votre copilote vers le poste idéal.
        </div>
      </div>

      {/* Right form container */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-4 lg:hidden">
            <Link href="/welcome" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Retour à l'accueil</span>
            </Link>
          </div>

          {currentUser ? <ActiveSessionBanner user={currentUser} /> : null}

          <div className="mb-4 flex items-center justify-center gap-2 text-xs font-semibold">
            <span className="text-slate-500">Inscription en tant que :</span>
            <span className={`rounded-full px-3 py-1 ${isRecruiter ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
              {isRecruiter ? 'Recruteur' : 'Candidat'}
            </span>
            <Link
              href={isRecruiter ? '/register?role=CANDIDATE' : '/register?role=RECRUITER'}
              className="text-slate-400 underline-offset-4 hover:text-blue-600 hover:underline"
            >
              Changer
            </Link>
          </div>

          <AuthForm
            key={selectedRole}
            title="Créer votre compte"
            description={
              isRecruiter
                ? "Créez votre espace recruteur pour publier des offres et gérer votre recrutement."
                : "Créez votre espace candidat pour rechercher des offres et postuler."
            }
            submitLabel="Créer mon compte"
            alternateLabel="Vous avez déjà un compte ?"
            alternateHref="/login"
            alternateText="Se connecter"
            action={registerAction}
            fields={[
              {
                name: 'firstName',
                label: 'Prénom',
                autoComplete: 'given-name',
              },
              {
                name: 'lastName',
                label: 'Nom',
                autoComplete: 'family-name',
              },
              {
                name: 'email',
                label: 'Adresse email',
                type: 'email',
                autoComplete: 'email',
              },
              {
                name: 'phone',
                label: 'Téléphone (optionnel)',
                type: 'tel',
                autoComplete: 'tel',
                required: false,
              },
              {
                name: 'role',
                label: 'Type de compte',
                defaultValue: selectedRole,
                options: [
                  { value: 'CANDIDATE', label: 'Espace candidat' },
                  { value: 'RECRUITER', label: 'Espace recruteur' },
                  ...(process.env.NODE_ENV === 'development' ? [{ value: 'ADMIN', label: 'Administrateur (dev)' }] : []),
                ],
              },
              {
                name: 'password',
                label: 'Mot de passe',
                type: 'password',
                autoComplete: 'new-password',
              },
            ]}
          />

          {selectedRole !== 'ADMIN' ? (
            <AlternateAuthMethods role={selectedRole} apiBaseUrl={API_BASE_URL} />
          ) : null}
        </div>
      </div>
    </main>
  );
}
