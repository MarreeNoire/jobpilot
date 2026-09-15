import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/lib/auth';
import DashboardPage from '../page';

export default async function RecruiterDashboardPage() {
  const user = await requireCurrentUser();

  if (user.role !== 'RECRUITER') {
    redirect('/dashboard');
  }

  return <DashboardPage />;
}
