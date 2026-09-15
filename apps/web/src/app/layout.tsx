import './globals.css';
import { Work_Sans, Fraunces, IBM_Plex_Mono } from 'next/font/google';

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-work-sans',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plex-mono',
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata = {
  title: "JobPilot — Assistant Intelligent de Recherche d'Emploi",
  description: "Optimisez vos candidatures, analysez la compatibilité de vos CV et automatisez votre recherche d'emploi grâce à l'IA.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full scroll-smooth">
      <body className={`${workSans.variable} ${fraunces.variable} ${plexMono.variable} font-sans min-h-full flex flex-col text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}