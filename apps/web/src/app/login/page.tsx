import { AuthForm } from '@/components/auth-form';
import { ActiveSessionBanner } from '@/components/active-session-banner';
import { loginAction } from '@/app/actions';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Sparkles, Zap } from 'lucide-react';

export default async function LoginPage() {
  // On ne redirige plus automatiquement si une session existe deja : un
  // utilisateur peut vouloir se connecter a un AUTRE compte (ex: passer
  // d'un compte candidat a un compte recruteur) sans etre bloque avant
  // meme d'avoir pu saisir ses identifiants.
  const currentUser = await getCurrentUser();

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
            <Zap className="h-3.5 w-3.5 text-blue-400" />
            <span>Assistant IA nouvelle génération</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Reprenez le contrôle de votre recherche d'emploi.
          </h2>
          <div className="space-y-3 pt-2 text-sm text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Matching instantané entre vos CVs et vos offres cibles</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Génération automatisée de candidatures sur-mesure</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Extension Chrome connectée pour capturer en 1 clic</span>
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

          <AuthForm
            title="Bon retour parmi nous"
            description="Connectez-vous pour continuer votre recherche d'emploi."
            submitLabel="Se connecter"
            alternateLabel="Vous n'avez pas encore de compte ?"
            alternateHref="/register"
            alternateText="Créer un compte"
            action={loginAction}
            fields={[
              {
                name: 'email',
                label: 'Adresse email',
                type: 'email',
                autoComplete: 'email',
              },
              {
                name: 'password',
                label: 'Mot de passe',
                type: 'password',
                autoComplete: 'current-password',
              },
            ]}
          />
        </div>
      </div>
    </main>
  );
}
