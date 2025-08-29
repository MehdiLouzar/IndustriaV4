'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BarChart3, Calendar, Download, Filter, TrendingUp, Users, 
  Building2, MapPin, Eye, FileText, PieChart, Activity
} from 'lucide-react'
import { secureDownloadFile } from '@/lib/download-actions'
import { secureApiRequest } from '@/lib/auth-actions'

interface ReportStats {
  totalZones: number
  totalParcels: number
  availableParcels: number
  totalUsers: number
  totalAppointments: number
  pendingAppointments: number
  totalContactRequests: number
  recentActivity: Array<{
    date: string
    zonesCreated: number
    appointmentsCreated: number
    usersRegistered: number
  }>
  zonesByStatus: Array<{
    status: string
    count: number
  }>
  parcelsByStatus: Array<{
    status: string
    count: number
  }>
  appointmentsByStatus: Array<{
    status: string
    count: number
  }>
  topRegions: Array<{
    region: string
    zonesCount: number
    parcelsCount: number
  }>
}

export default function ReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  })

  const loadStats = async () => {
    setLoading(true)
    try {
      const { data: response, error } = await secureApiRequest<ReportStats>('/api/admin/reports/stats')
      if (error) {
        console.error('Erreur lors du chargement des statistiques:', error)
        setError('Erreur lors du chargement des données')
      } else {
        setStats(response)
      }
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const params = new URLSearchParams({
        format,
        from: dateRange.from,
        to: dateRange.to
      })
      
      const defaultFilename = `rapport_${format}.${format === 'excel' ? 'xlsx' : format}`
      const result = await secureDownloadFile('/api/admin/reports/export', Object.fromEntries(params))
      if (result.error) {
        throw new Error(result.error)
      }
      if (result.blob) {
        const blob = new Blob([result.blob], { type: result.contentType })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = result.filename || defaultFilename
        document.body.appendChild(link)
        link.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(link)
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      setError('Erreur lors de l\'export du rapport')
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }
    }
    loadStats()
  }, [router])

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-industria-brown-gold mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des rapports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rapports et Analytics</h1>
        <p className="text-gray-600">Analyse des données et rapports détaillés</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filtres et exports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres et Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Date de début</Label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
              />
            </div>
            <div>
              <Label>Date de fin</Label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={loadStats} className="w-full">
                Actualiser
              </Button>
            </div>
            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportReport('csv')}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-1" />
                CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportReport('excel')}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-1" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {stats && (
        <>
          {/* Statistiques générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Zones Totales</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalZones}</div>
                <p className="text-xs text-muted-foreground">
                  Zones industrielles créées
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Parcelles Disponibles</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.availableParcels}</div>
                <p className="text-xs text-muted-foreground">
                  Sur {stats.totalParcels} parcelles total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Comptes actifs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">RDV en Attente</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.pendingAppointments > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {stats.pendingAppointments}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sur {stats.totalAppointments} total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Répartition par statut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Zones par Statut
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.zonesByStatus.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{item.status}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Parcelles par Statut
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.parcelsByStatus.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{item.status}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  RDV par Statut
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.appointmentsByStatus.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{item.status}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top régions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Régions les Plus Actives
              </CardTitle>
              <CardDescription>
                Répartition des zones et parcelles par région
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topRegions.slice(0, 10).map((region, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">{region.region}</h4>
                      <p className="text-sm text-gray-600">
                        {region.zonesCount} zones • {region.parcelsCount} parcelles
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{region.zonesCount + region.parcelsCount}</div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Activité récente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Activité Récente (7 derniers jours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivity.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border-l-4 border-industria-brown-gold bg-gray-50 rounded-r-lg">
                    <div>
                      <h4 className="font-medium">{new Date(day.date).toLocaleDateString('fr-FR')}</h4>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-blue-600">{day.zonesCreated} zones</span>
                      <span className="text-green-600">{day.appointmentsCreated} RDV</span>
                      <span className="text-purple-600">{day.usersRegistered} users</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}