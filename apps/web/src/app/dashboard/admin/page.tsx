import { cookies } from 'next/headers';
import { requireCurrentUser } from '@/lib/auth';
import { AdminDashboard } from '@/components/admin-dashboard';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const user = await requireCurrentUser();

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('jobpilot_token')?.value;

  if (!token) {
    redirect('/login');
  }

  return (
    <main className="min-h-screen bg-slate-50/60 p-4 sm:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <DashboardHeader user={user} />
        <DashboardNav role={user.role} />
        <AdminDashboard token={token} user={user} />
      </div>
    </main>
  );
}