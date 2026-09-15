import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={`${inter.className} min-h-full flex flex-col text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}