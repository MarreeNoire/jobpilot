'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UserRole } from '@/lib/api';
import {
  Bell,
  Briefcase,
  FileText,
  LayoutDashboard,
  Send,
  Shield,
  SlidersHorizontal,
  User,
  Zap,
} from 'lucide-react';

const candidateItems = [
  { href: '/dashboard', label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: '/dashboard/profile', label: 'Profil', icon: User },
  { href: '/dashboard/preferences', label: 'Préférences', icon: SlidersHorizontal },
  { href: '/dashboard/resumes', label: 'CVs', icon: FileText },
  { href: '/dashboard/cover-letters', label: 'Lettres', icon: FileText },
  { href: '/dashboard/jobs', label: 'Offres', icon: Briefcase },
  { href: '/dashboard/applications', label: 'Candidatures', icon: Send },
  { href: '/dashboard/automation', label: 'Automatisation', icon: Zap },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
];

const recruiterItems = [
  { href: '/dashboard', label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: '/dashboard/applications', label: 'Candidatures reçues', icon: Send },
  { href: '/dashboard/jobs', label: 'Offres publiées', icon: Briefcase },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
];

const adminItems = [
  { href: '/dashboard/admin', label: 'Administration', icon: Shield },
];

export function DashboardNav({ role = 'CANDIDATE' }: { role?: UserRole }) {
  const pathname = usePathname();

  const items = role === 'ADMIN' ? adminItems : role === 'RECRUITER' ? recruiterItems : candidateItems;

  return (
    <nav className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4 py-1.5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:rounded-2xl sm:border sm:border-slate-200/80 sm:bg-white sm:p-1.5 sm:shadow-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname?.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-medium transition-all sm:border-0 sm:px-4 sm:py-2.5 sm:text-sm ${
              isActive
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 border-blue-600'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
