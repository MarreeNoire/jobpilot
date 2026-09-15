import Link from 'next/link';
import { requireCurrentUser } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/api';
import { cookies } from 'next/headers';
import { ProfileForm } from '@/components/profile-form';
import { saveProfileAction, type Profile } from './actions';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import { ArrowLeft, UserCheck } from 'lucide-react';

async function getProfile(): Promise<Profile | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('jobpilot_token')?.value;

  if (!token) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/api/profile`, {
    headers: {
      Cookie: `jobpilot_token=${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { profile: Profile | null };
  return data.profile;
}

export default async function ProfilePage() {
  const user = await requireCurrentUser();
  const profile = await getProfile();

  return (
    <main className="min-h-screen bg-slate-50/60 p-4 sm:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <DashboardHeader user={user} />
        <DashboardNav role={user.role} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">
                Profil Professionnel
              </h1>
              <p className="text-xs text-slate-500">
                Ce profil sert de référence pour le matching des offres et la personnalisation de vos candidatures.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Tableau de bord</span>
          </Link>
        </div>

        <ProfileForm profile={profile} action={saveProfileAction} />
      </div>
    </main>
  );
}
