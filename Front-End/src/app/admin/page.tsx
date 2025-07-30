export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/utils';
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
  Activity
} from 'lucide-react';
import Link from 'next/link';

async function getAdminStats() {
  const data = await fetchApi('/api/admin/stats');
  if (!data) {
    return {
      totalUsers: 0,
      totalZones: 0,
      availableParcels: 0,
      totalParcels: 0,
      pendingAppointments: 0,
      totalAppointments: 0,
      recentActivities: []
    };
  }
  return data;
}

export default async function AdminDashboard() {

  const stats = await getAdminStats();

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
      title: 'Activités & Équipements',
      description: 'Gérer les types d\'activités et équipements',
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
      title: 'Rapports',
      description: 'Analytics et rapports détaillés',
      icon: BarChart3,
      href: '/admin/reports',
      color: 'bg-indigo-500',
      permission: ['ADMIN', 'MANAGER']
    }
  ];

  const filteredCards = adminCards;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
              <p className="text-gray-600">Tableau de bord</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline">
                  ← Retour au site
                </Button>
              </Link>
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
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Comptes actifs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Zones</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalZones}</div>
              <p className="text-xs text-muted-foreground">Zones industrielles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Parcelles</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.availableParcels}</div>
              <p className="text-xs text-muted-foreground">Sur {stats.totalParcels} total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">RDV en attente</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingAppointments}</div>
              <p className="text-xs text-muted-foreground">Sur {stats.totalAppointments} total</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions d'administration */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <Link key={index} href={card.href}>
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
              {stats.recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-600">{activity.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {activity.user?.name || 'Système'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(activity.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
              {stats.recentActivities.length === 0 && (
                <p className="text-gray-500 text-center py-4">Aucune activité récente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
