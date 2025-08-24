'use client'

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/utils';
import AdminGuard from '@/components/AdminGuard';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Users,
  MapPin,
  Calendar,
  TrendingUp,
  Building2,
  Factory,
  Settings,
  FileText,
  BarChart3,
  Activity,
  LogOut
} from 'lucide-react';
import Link from 'next/link';

interface AdminStats {
  totalUsers: number;
  totalZones: number;
  availableParcels: number;
  totalParcels: number;
  pendingAppointments: number;
  totalAppointments: number;
  recentActivities: Array<{
    id: string;
    action: string;
    description: string;
    user?: { name: string };
    createdAt: string;
  }>;
}

const emptyStats: AdminStats = {
  totalUsers: 0,
  totalZones: 0,
  availableParcels: 0,
  totalParcels: 0,
  pendingAppointments: 0,
  totalAppointments: 0,
  recentActivities: [],
};


function AdminDashboardContent() {
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats>(emptyStats)
  const { canAccessFunction, permissions } = usePermissions()
  
  // Fonction de déconnexion
  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/auth/login')
  }

  // Chargement des statistiques côté client
  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await fetchApi<AdminStats>('/api/admin/stats');
        setStats(statsData || emptyStats);
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        setStats(emptyStats);
      }
    }
    loadStats()
  }, [])

  const adminCards = [
    {
      title: 'Gestion des Zones',
      description: 'Créer et gérer les zones industrielles',
      icon: Factory,
      href: '/admin/zones',
      color: 'bg-blue-500',
      permission: ['ADMIN', 'MANAGER']
    },
    {
      title: 'Pays',
      description: 'Gérer la liste des pays',
      icon: MapPin,
      href: '/admin/countries',
      color: 'bg-lime-500',
      permission: ['ADMIN']
    },
    {
      title: 'Régions',
      description: 'Gérer les régions',
      icon: MapPin,
      href: '/admin/regions',
      color: 'bg-emerald-500',
      permission: ['ADMIN']
    },
    {
      title: 'Types de zone',
      description: 'Catégories de zones',
      icon: Factory,
      href: '/admin/zone-types',
      color: 'bg-teal-500',
      permission: ['ADMIN']
    },
    {
      title: 'Gestion des Parcelles',
      description: 'Gérer les parcelles dans les zones',
      icon: MapPin,
      href: '/admin/parcels',
      color: 'bg-green-500',
      permission: ['ADMIN', 'MANAGER']
    },
    {
      title: 'Rendez-vous',
      description: 'Gérer les demandes de RDV',
      icon: Calendar,
      href: '/admin/appointments',
      color: 'bg-orange-500',
      permission: ['ADMIN', 'MANAGER']
    },
    {
      title: 'Utilisateurs',
      description: 'Gestion des comptes utilisateurs',
      icon: Users,
      href: '/admin/users',
      color: 'bg-purple-500',
      permission: ['ADMIN']
    },
    {
      title: 'Activités',
      description: 'Gérer les types d\'activités',
      icon: Settings,
      href: '/admin/activities',
      color: 'bg-red-500',
      permission: ['ADMIN']
    },
    {
      title: 'Équipements',
      description: 'Gérer les équipements disponibles',
      icon: Settings,
      href: '/admin/amenities',
      color: 'bg-pink-500',
      permission: ['ADMIN']
    },
    {
      title: 'Types de Construction',
      description: 'Gérer les types de construction',
      icon: Building2,
      href: '/admin/construction-types',
      color: 'bg-cyan-500',
      permission: ['ADMIN']
    },
    {
      title: 'Notifications',
      description: 'Gestion des notifications email',
      icon: FileText,
      href: '/admin/notifications',
      color: 'bg-yellow-500',
      permission: ['ADMIN', 'MANAGER']
    },
    {
      title: 'Demandes de contact',
      description: 'Gérer les demandes de rendez-vous',
      icon: FileText,
      href: '/admin/contact-requests',
      color: 'bg-blue-500',
      permission: ['ADMIN']
    },
    {
      title: 'Journal d\'audit',
      description: 'Logs d\'activité système',
      icon: Activity,
      href: '/admin/audit-logs',
      color: 'bg-gray-500',
      permission: ['ADMIN']
    },
    {
      title: 'Rapports',
      description: 'Analytics et rapports détaillés',
      icon: BarChart3,
      href: '/admin/reports',
      color: 'bg-indigo-500',
      permission: ['ADMIN', 'MANAGER']
    }
  ];

  // Filtrer les cartes selon les permissions
  const filteredCards = adminCards.filter(card => {
    const functionName = card.href.replace('/admin/', '')
    return canAccessFunction(functionName)
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
              <div className="text-gray-600">
                <p>Tableau de bord - Rôle:</p>
                <Badge variant="outline" className="mt-1 inline-flex">{permissions?.role}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                  variant="outline"
                  onClick={() => router.push('/')}
                className="bg-industria-brown-gold text-white hover:bg-industria-olive-light"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Retourner au site
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Se déconnecter
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalUsers || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Comptes actifs
                {stats.totalUsers > 0 && (
                  <span className="text-green-600 ml-1">↗ +12% ce mois</span>
                )}
                {stats.totalUsers === 0 && (
                  <span className="text-gray-400 ml-1">Aucun utilisateur</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Zones</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalZones}</div>
              <p className="text-xs text-muted-foreground">
                Zones industrielles
                {stats.totalZones > 0 && (
                  <span className="text-blue-600 ml-1">↗ +3 nouvelles</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Parcelles</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.availableParcels}</div>
              <p className="text-xs text-muted-foreground">
                Sur {stats.totalParcels} total
                {stats.totalParcels > 0 && (
                  <span className="text-orange-600 ml-1">
                    ({Math.round((stats.availableParcels / stats.totalParcels) * 100)}% libre)
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">RDV en attente</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <span className={stats.pendingAppointments > 0 ? "text-red-600" : "text-green-600"}>
                  {stats.pendingAppointments}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Sur {stats.totalAppointments} total
                {stats.pendingAppointments > 0 && (
                  <span className="text-red-600 ml-1">⚠ À traiter</span>
                )}
                {stats.pendingAppointments === 0 && stats.totalAppointments > 0 && (
                  <span className="text-green-600 ml-1">✓ Tous traités</span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions d'administration */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {(Array.isArray(filteredCards) ? filteredCards : []).map((card, index) => {
            const IconComponent = card.icon;
            return (
              <Link key={index} href={card.href} prefetch={false}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${card.color} text-white`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{card.title}</CardTitle>
                        <CardDescription>{card.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Activités récentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Activités récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(Array.isArray(stats.recentActivities) ? stats.recentActivities : []).map((activity, index) => (
                <div key={activity.id || index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-600">{activity.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xs text-gray-500">
                      {activity.user?.name || 'Système'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(activity.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {(Array.isArray(stats.recentActivities) ? stats.recentActivities.length : 0) === 0 && (
                <p className="text-gray-500 text-center py-4">Aucune activité récente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return <AdminDashboardContent />;
}
