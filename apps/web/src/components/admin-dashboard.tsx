'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { PublicUser } from '@/lib/api';
import { getClientToken } from '@/lib/clientAuth';
import {
  Shield,
  Users,
  Briefcase,
  FileText,
  Activity,
  Server,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalCandidates: number;
  totalRecruiters: number;
  totalJobs: number;
  totalApplications: number;
  activeUsersLast30Days: number;
  applicationsByStatus: Record<string, number>;
  jobsByStatus: Record<string, number>;
}

interface SystemHealth {
  status: string;
  database: string;
  timestamp: string;
  recentActivityCount: number;
}

interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  _count?: {
    applications: number;
    postedJobs: number;
  };
}

interface AdminDashboardProps {
  token: string | undefined;
  user: PublicUser;
}

export function AdminDashboard({ token, user }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    if (!token) {
      setError('Token non disponible');
      setLoading(false);
      return;
    }
    fetchAdminData(token);
  }, [token, currentPage, roleFilter, searchTerm]);

  const fetchAdminData = async (authToken: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stats
      const statsResponse = await fetch(`${apiUrl}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        credentials: 'include'
      });

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch admin stats');
      }

      const statsData = await statsResponse.json();
      setStats(statsData.stats);

      // Fetch system health (non bloquant : n'affecte pas le chargement principal en cas d'échec)
      try {
        const healthResponse = await fetch(`${apiUrl}/api/admin/health`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          credentials: 'include'
        });
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          setHealth(healthData.health);
          setHealthError(false);
        } else {
          setHealthError(true);
        }
      } catch {
        setHealthError(true);
      }

      // Fetch users
      const usersResponse = await fetch(
        `${apiUrl}/api/admin/users?page=${currentPage}&limit=20&role=${roleFilter}&search=${searchTerm}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          credentials: 'include'
        }
      );

      if (!usersResponse.ok) {
        throw new Error('Failed to fetch users');
      }

      const usersData = await usersResponse.json();
      setUsers(usersData.users);
      setTotalPages(usersData.pagination?.totalPages ?? 1);
      setTotalUsers(usersData.pagination?.total ?? usersData.users.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string, currentRole: string) => {
    if (newRole === currentRole) {
      return;
    }

    if (
      !confirm(
        `Confirmer le changement de rôle : ${currentRole} → ${newRole} ?\n\nCette action modifie immédiatement les permissions de l'utilisateur.`
      )
    ) {
      return;
    }

    if (!token) {
      setError('Token non disponible');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      // Refresh users list
      fetchAdminData(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    if (!token) {
      setError('Token non disponible');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      // Refresh users list
      fetchAdminData(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-slate-600">Chargement du tableau de bord admin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div>
            <p className="font-semibold text-red-900">Erreur de chargement</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Admin Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-900 p-8 text-white shadow-lg shadow-purple-500/10">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <Shield className="h-3.5 w-3.5 text-yellow-300" />
              <span>Administration Système</span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Espace Administrateur
            </h1>
            <p className="mt-2 max-w-xl text-purple-100 text-sm sm:text-base leading-relaxed">
              Gérez les utilisateurs, surveillez l'activité du système et maintenez la plateforme.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-purple-200">{user.email}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <Shield className="h-6 w-6" />
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Utilisateurs</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
            <p className="mt-1 text-xs text-slate-500">
              {stats.activeUsersLast30Days} actifs (30 derniers jours)
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Candidats</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">{stats.totalCandidates}</p>
            <p className="mt-1 text-xs text-slate-500">
              {((stats.totalCandidates / stats.totalUsers) * 100).toFixed(1)}% des utilisateurs
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recruteurs</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Briefcase className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">{stats.totalRecruiters}</p>
            <p className="mt-1 text-xs text-slate-500">
              {((stats.totalRecruiters / stats.totalUsers) * 100).toFixed(1)}% des utilisateurs
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Offres</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Briefcase className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">{stats.totalJobs}</p>
            <p className="mt-1 text-xs text-slate-500">
              {stats.totalApplications} candidatures totales
            </p>
          </div>
        </section>
      )}

      {/* User Management Section */}
      <section className="rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Gestion des Utilisateurs</h2>
              <p className="text-xs text-slate-500">Administrer les comptes utilisateurs et leurs rôles</p>
            </div>
            
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => {
                    setCurrentPage(1);
                    setSearchTerm(e.target.value);
                  }}
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              
              <select
                value={roleFilter}
                onChange={(e) => {
                  setCurrentPage(1);
                  setRoleFilter(e.target.value);
                }}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">Tous les rôles</option>
                <option value="CANDIDATE">Candidats</option>
                <option value="RECRUITER">Recruteurs</option>
                <option value="ADMIN">Admins</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Rôle</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Statistiques</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date d'inscription</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((userItem) => (
                <tr key={userItem.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {userItem.firstName} {userItem.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{userItem.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={userItem.role}
                      onChange={(e) => handleRoleChange(userItem.id, e.target.value, userItem.role)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="CANDIDATE">Candidat</option>
                      <option value="RECRUITER">Recruteur</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-4 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {userItem._count?.applications || 0} candidatures
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {userItem._count?.postedJobs || 0} offres
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-600">
                      {new Date(userItem.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/admin/users/${userItem.id}`}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Voir détails"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteUser(userItem.id)}
                        className="rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-2 text-sm text-slate-600">Aucun utilisateur trouvé</p>
          </div>
        )}

        {totalUsers > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="docket">
              {totalUsers} utilisateur{totalUsers > 1 ? 's' : ''} au total — page {currentPage} sur {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Précédent
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Suivant
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* System Health Section */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">État du Système</h2>
            <p className="text-xs text-slate-500">Surveillance de la santé et de la performance</p>
          </div>
          {healthError ? (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-sm font-semibold text-red-600">Statut indisponible</span>
            </div>
          ) : health?.status === 'healthy' ? (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-emerald-600">Système opérationnel</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm font-semibold text-amber-600">Vérification en cours...</span>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className={`rounded-2xl border p-4 ${
            healthError || health?.database !== 'connected'
              ? 'border-red-200 bg-red-50'
              : 'border-emerald-200 bg-emerald-50'
          }`}>
            <div className="flex items-center gap-3">
              <Server className={`h-5 w-5 ${healthError || health?.database !== 'connected' ? 'text-red-600' : 'text-emerald-600'}`} />
              <div>
                <p className="text-xs font-semibold text-slate-600">Base de données</p>
                <p className={`text-sm font-bold ${healthError || health?.database !== 'connected' ? 'text-red-700' : 'text-emerald-700'}`}>
                  {healthError ? 'Inconnue' : health?.database === 'connected' ? 'Connectée' : 'Déconnectée'}
                </p>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border p-4 ${healthError ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
            <div className="flex items-center gap-3">
              <Activity className={`h-5 w-5 ${healthError ? 'text-red-600' : 'text-blue-600'}`} />
              <div>
                <p className="text-xs font-semibold text-slate-600">API</p>
                <p className={`text-sm font-bold ${healthError ? 'text-red-700' : 'text-blue-700'}`}>
                  {healthError ? 'Injoignable' : 'Opérationnelle'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-xs font-semibold text-slate-600">Activité (24h)</p>
                <p className="text-sm font-bold text-purple-700">
                  {health ? `${health.recentActivityCount} événement${health.recentActivityCount > 1 ? 's' : ''}` : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}