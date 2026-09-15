import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  FileCheck,
  FileText,
  Layers,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  User,
  Zap,
} from 'lucide-react';

const steps = [
  {
    step: '01',
    title: 'Créez votre compte',
    description: 'Accédez instantanément à votre espace de travail sécurisé et sauvegardez votre progression.',
    href: '/register',
    cta: 'Inscription gratuite',
    icon: Sparkles,
  },
  {
    step: '02',
    title: 'Complétez votre profil',
    description: 'Renseignez vos expériences clés, compétences phares et votre disponibilité pour alimenter le moteur IA.',
    href: '/login',
    cta: 'Éditer mon profil',
    icon: FileText,
  },
  {
    step: '03',
    title: 'Définissez vos critères',
    description: 'Précisez vos postes cibles, exigences de salaire, contrat et préférences de télétravail.',
    href: '/login',
    cta: 'Configurer les critères',
    icon: SlidersHorizontal,
  },
  {
    step: '04',
    title: 'Gérez CVs et candidatures',
    description: 'Enregistrez vos variantes de CV et suivez toutes vos offres dans un pipeline centralisé.',
    href: '/login',
    cta: 'Ouvrir le tableau de bord',
    icon: Briefcase,
  },
];

const features = [
  {
    title: 'Analyse & Matching IA',
    description: "Calcul immédiat du score de compatibilité entre votre profil et n'importe quelle offre d'emploi du marché.",
    icon: Zap,
    badge: 'Intelligence Artificielle',
  },
  {
    title: 'Gestionnaire Multi-CV',
    description: "Associez le bon CV à la bonne opportunité pour maximiser votre taux de réponse auprès des recruteurs.",
    icon: FileCheck,
    badge: 'Ciblage sur-mesure',
  },
  {
    title: 'Extension Chrome Dédiée',
    description: "Capturez les offres en 1 clic directement depuis LinkedIn, Indeed, Welcome to the Jungle et bien d'autres.",
    icon: Layers,
    badge: 'Gain de temps',
  },
  {
    title: 'Pipeline de Suivi Unifié',
    description: "Centralisez le statut de toutes vos candidatures dans un tableau de bord clair et ordonné.",
    icon: ShieldCheck,
    badge: 'Organisation totale',
  },
];

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/welcome" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">JobPilot</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition">Fonctionnalités</a>
            <a href="#workflow" className="hover:text-blue-600 transition">Comment ça marche</a>
            <a href="#preview" className="hover:text-blue-600 transition">Aperçu interactif</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Connexion
            </Link>
            <a
              href="#choisir-espace"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition"
            >
              Commencer
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.blue.100),transparent)] opacity-60" />

        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Assistant IA & Extension Chrome pour votre carrière</span>
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
            Décrochez votre prochain emploi, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 bg-clip-text text-transparent">
              5x plus vite grâce à l'IA
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 sm:text-xl">
            JobPilot analyse automatiquement la compatibilité de vos CV avec les offres,
            personnalise vos démarches et vous fait gagner un temps précieux à chaque candidature.
          </p>

          {/* Role selection: candidate vs recruiter */}
          <div id="choisir-espace" className="mx-auto mt-10 max-w-2xl scroll-mt-24">
            <p className="text-sm font-semibold text-slate-500">
              Vous êtes candidat ou recruteur ? Choisissez votre espace pour commencer.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Link
                href="/register?role=CANDIDATE"
                className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900">Espace Candidat</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Trouvez des offres, gérez vos CVs et postulez en quelques clics.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                  <span>Rejoindre en tant que candidat</span>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>

              <Link
                href="/register?role=RECRUITER"
                className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900">Espace Recruteur</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Publiez vos offres d'emploi et centralisez votre recrutement.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
                  <span>Rejoindre en tant que recruteur</span>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Vous avez déjà un compte ?{' '}
              <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline">
                Se connecter
              </Link>
            </p>
          </div>

          {/* Social Proof metrics */}
          <div className="mt-14 grid grid-cols-2 gap-4 rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-sm sm:grid-cols-4">
            <div>
              <p className="text-3xl font-extrabold text-blue-600">+85%</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Taux de pertinence des offres</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-indigo-600">x3</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Plus de retours recruteurs</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-blue-600">1-Clic</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Capture d'offres en ligne</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-indigo-600">100%</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Contrôle sur vos données</p>
            </div>
          </div>
        </div>

        {/* Interactive Mockup / Visual Preview */}
        <div id="preview" className="mx-auto mt-16 max-w-5xl px-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-900 p-3 shadow-2xl ring-1 ring-slate-900/10">
            <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3 text-xs text-slate-400">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="ml-2 font-mono text-slate-400">jobpilot.app/dashboard/preview</span>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-3 bg-slate-950 text-white rounded-b-2xl">
              {/* Card 1: Job Detected */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="rounded-md bg-blue-900/50 px-2 py-0.5 text-blue-300 font-semibold border border-blue-700/50">
                    LinkedIn
                  </span>
                  <span>Il y a 2h</span>
                </div>
                <h2 className="mt-3 text-base font-semibold text-white">Lead Fullstack Developer</h2>
                <p className="text-xs text-slate-400">TechCorp Solutions · Paris / Hybride</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">TypeScript</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">React</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">Node.js</span>
                </div>
                <div className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-400">
                  Salaire : <span className="font-semibold text-emerald-400">65k - 75k €</span>
                </div>
              </div>

              {/* Card 2: AI Compatibility Match */}
              <div className="rounded-2xl border border-blue-500/40 bg-gradient-to-b from-blue-950/40 to-slate-900/80 p-5 shadow-lg shadow-blue-500/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Score d'adéquation</span>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                    94% Match
                  </span>
                </div>
                <div className="mt-4 space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>5+ ans d'expérience validés</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Stack technique 100% alignée</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Localisation & Télétravail compatibles</span>
                  </div>
                </div>
                <div className="mt-5 rounded-xl bg-blue-950/80 p-3 text-[11px] text-blue-200 border border-blue-800/50">
                  💡 <span className="font-medium">Conseil IA :</span> Mettez en avant votre CV « Tech Lead 2025 » pour cette opportunité.
                </div>
              </div>

              {/* Card 3: Actionable automation */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Action Recommandée</span>
                  <h3 className="mt-2 text-sm font-semibold text-white">Candidature prête à générer</h3>
                  <p className="mt-2 text-xs text-slate-400">
                    Le CV principal et la lettre d'accompagnement sur mesure sont pré-remplis pour cette offre.
                  </p>
                </div>
                <div className="mt-4 space-y-2">
                  <button className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition shadow-md shadow-blue-500/25">
                    Générer la candidature
                  </button>
                  <button className="w-full rounded-xl border border-slate-700 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition">
                    Consulter l'offre originale
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="py-20 border-t border-slate-200/80 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Fonctionnalités avancées
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Tout ce dont vous avez besoin pour réussir
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-slate-600">
              Des outils intuitifs conçus pour optimiser chaque étape de votre recherche d'emploi.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 transition-all hover:-translate-y-1 hover:border-blue-300 hover:bg-white hover:shadow-xl hover:shadow-slate-200/60"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="mt-4 inline-block rounded-full bg-slate-200/60 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                    {feature.badge}
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow Step by Step */}
      <section id="workflow" className="py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Parcours simple
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Votre espace de travail en 4 étapes
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-slate-600">
              Configurez votre profil une seule fois et laissez l'assistant vous propulser vers les meilleures opportunités.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-2xl font-black text-blue-600/30">{item.step}</span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
                    >
                      <span>{item.cta}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-3xl bg-gradient-to-tr from-blue-700 via-indigo-700 to-blue-900 p-8 sm:p-12 text-center text-white shadow-xl shadow-blue-500/20">
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              Prêt à booster votre recherche d'emploi ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-blue-100 text-sm sm:text-base">
              Rejoignez JobPilot dès aujourd'hui et donnez à vos candidatures l'impact qu'elles méritent.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="rounded-xl bg-white px-6 py-3 font-bold text-blue-700 shadow-md transition hover:bg-blue-50"
              >
                Créer un compte gratuitement
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-blue-300/40 px-6 py-3 font-semibold text-white transition hover:bg-blue-800/60"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-slate-800">JobPilot</span>
            <span>— Tous droits réservés.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-slate-900 transition">Connexion</Link>
            <Link href="/register" className="hover:text-slate-900 transition">Inscription</Link>
            <Link href="/dashboard" className="hover:text-slate-900 transition">Espace candidat</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
