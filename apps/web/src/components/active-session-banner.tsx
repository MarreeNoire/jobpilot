import { logoutAction } from '@/app/actions';
import { AlertTriangle } from 'lucide-react';
import type { PublicUser } from '@/lib/api';

interface ActiveSessionBannerProps {
  user: PublicUser;
}

const ROLE_LABEL: Record<PublicUser['role'], string> = {
  CANDIDATE: 'candidat',
  RECRUITER: 'recruteur',
  ADMIN: 'administrateur',
};

export function ActiveSessionBanner({ user }: ActiveSessionBannerProps) {
  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800">
      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p>
          Vous êtes déjà connecté en tant que <strong>{ROLE_LABEL[user.role]}</strong> ({user.email}).
          Continuer ci-dessous créera ou ouvrira une session différente.
        </p>
        <form action={logoutAction} className="mt-2">
          <button
            type="submit"
            className="text-xs font-semibold text-amber-900 underline underline-offset-4 hover:text-amber-950"
          >
            Se déconnecter de ce compte
          </button>
        </form>
      </div>
    </div>
  );
}
