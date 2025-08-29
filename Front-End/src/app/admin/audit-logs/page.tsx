'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Pagination from '@/components/Pagination'
import type { ListResponse } from '@/types'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AUDIT_ACTIONS, getEnumBadge } from '@/lib/translations'
import { secureDownloadFile } from '@/lib/download-actions'

import { useSecureApi } from '@/hooks/use-api'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
}

interface AuditLog {
  id: string
  action:
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'LOGIN'
    | 'LOGOUT'
    | 'SOFT_DELETE'
    | 'RESTORE'
    | 'APPOINTMENT_CONFIRMED'
    | 'APPOINTMENT_CANCELLED'
    | 'APPOINTMENT_RESCHEDULED'
  entity: string
  entityId?: string
  oldValues?: string
  newValues?: string
  description?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
  userId?: string
  userEmail?: string
  user?: User
}

export default function AuditLogsAdmin() {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const [open, setOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const [filters, setFilters] = useState({
    action: 'ALL',
    entity: '',
    userId: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  })

  // Build URL for secure fetch
  const listUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: String(currentPage - 1),
      size: String(itemsPerPage),
    })
    if (filters.action && filters.action !== 'ALL') params.append('action', filters.action)
    if (filters.entity) params.append('entity', filters.entity)
    if (filters.userId) params.append('userId', filters.userId)
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.append('dateTo', filters.dateTo)
    if (filters.search) params.append('search', filters.search)
    return `/api/audit-logs?${params.toString()}`
  }, [currentPage, itemsPerPage, filters])

  const {
    data: pageData,
    loading,
    error,
    refetch,
  } = useSecureApi<any>(listUrl)

  const items: AuditLog[] = Array.isArray(pageData?.content) ? pageData.content : []
  const totalPages: number = pageData?.totalPages ?? 1
  const serverPageIndex: number | undefined = pageData?.number

  // Keep client page in sync with server response
  useEffect(() => {
    if (typeof serverPageIndex === 'number') {
      const serverPage1 = serverPageIndex + 1
      if (serverPage1 !== currentPage) setCurrentPage(serverPage1)
    }
  }, [serverPageIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  function openDetails(log: AuditLog) {
    setSelectedLog(log)
    setOpen(true)
  }

  function getActionBadge(action: string) {
    const badge = getEnumBadge(AUDIT_ACTIONS, action)
    return <Badge className={badge.color}>{badge.label}</Badge>
  }

  function formatJsonDiff(oldValues?: string, newValues?: string) {
    if (!oldValues && !newValues) return null

    try {
      const oldObj = oldValues ? JSON.parse(oldValues) : {}
      const newObj = newValues ? JSON.parse(newValues) : {}

      return (
        <div className="space-y-2">
          {oldValues && (
            <div>
              <h4 className="font-medium text-sm text-red-600">Anciennes valeurs:</h4>
              <pre className="text-xs bg-red-50 p-2 rounded overflow-x-auto">
                {JSON.stringify(oldObj, null, 2)}
              </pre>
            </div>
          )}
          {newValues && (
            <div>
              <h4 className="font-medium text-sm text-green-600">Nouvelles valeurs:</h4>
              <pre className="text-xs bg-green-50 p-2 rounded overflow-x-auto">
                {JSON.stringify(newObj, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )
    } catch {
      return (
        <div className="space-y-2">
          {oldValues && (
            <div>
              <h4 className="font-medium text-sm text-red-600">Anciennes valeurs:</h4>
              <pre className="text-xs bg-red-50 p-2 rounded whitespace-pre-wrap">{oldValues}</pre>
            </div>
          )}
          {newValues && (
            <div>
              <h4 className="font-medium text-sm text-green-600">Nouvelles valeurs:</h4>
              <pre className="text-xs bg-green-50 p-2 rounded whitespace-pre-wrap">{newValues}</pre>
            </div>
          )}
        </div>
      )
    }
  }

  function resetFilters() {
    setFilters({
      action: 'ALL',
      entity: '',
      userId: '',
      dateFrom: '',
      dateTo: '',
      search: '',
    })
  }

  async function exportLogs() {
    const params = new URLSearchParams({ format: 'csv' })
    if (filters.action && filters.action !== 'ALL') params.append('action', filters.action)
    if (filters.entity) params.append('entity', filters.entity)
    if (filters.userId) params.append('userId', filters.userId)
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.append('dateTo', filters.dateTo)
    if (filters.search) params.append('search', filters.search)

    try {
      const result = await secureDownloadFile('/api/admin/audit-logs/export', Object.fromEntries(params))
      if (result.error) {
        throw new Error(result.error)
      }
      if (result.blob) {
        const blob = new Blob([result.blob], { type: result.contentType })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = result.filename || 'audit_logs_export.csv'
        document.body.appendChild(link)
        link.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(link)
      }
    } catch (e) {
      console.error("Erreur lors de l'export:", e)
      alert("Erreur lors de l'export. Veuillez réessayer.")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Journal d'audit</h1>
              <p className="text-gray-600">Consultation des logs d'activité système</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={resetFilters}>
                Réinitialiser filtres
              </Button>
              <Button onClick={exportLogs} className="header-red text-white">
                Exporter CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Action</Label>
                <Select
                  value={filters.action}
                  onValueChange={(value) => setFilters({ ...filters, action: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Toutes les actions</SelectItem>
                    {AUDIT_ACTIONS.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        {action.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Entité</Label>
                <Input
                  value={filters.entity}
                  onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
                  placeholder="Ex: Zone, User, Parcel..."
                />
              </div>

              <div>
                <Label>Date de début</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>

              <div>
                <Label>Date de fin</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-4">
              <Label>Recherche libre</Label>
              <Input
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Rechercher dans la description, IP, utilisateur..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logs d'audit ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getActionBadge(log.action)}
                      <span className="font-medium">{log.entity}</span>
                      {log.entityId && (
                        <span className="text-sm text-gray-500">#{log.entityId.substring(0, 8)}</span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">Utilisateur:</span>{' '}
                        {log.userEmail ||
                          (log.user
                            ? `${log.user.email} (${log.user.firstName || ''} ${log.user.lastName || ''})`.trim()
                            : 'Système')}
                      </p>
                      <p>
                        <span className="font-medium">Date:</span>{' '}
                        {new Date(log.createdAt).toLocaleString('fr-FR')}
                      </p>
                      {log.ipAddress && (
                        <p>
                          <span className="font-medium">IP:</span> {log.ipAddress}
                        </p>
                      )}
                      {log.description && (
                        <p>
                          <span className="font-medium">Description:</span> {log.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openDetails(log)}>
                      Détails
                    </Button>
                  </div>
                </div>
              ))}

              {items.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  Aucun log trouvé avec les filtres actuels
                </div>
              )}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du log d'audit</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Action</Label>
                  <div>{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <Label>Entité</Label>
                  <p className="font-mono text-sm">{selectedLog.entity}</p>
                </div>
              </div>

              {selectedLog.entityId && (
                <div>
                  <Label>ID Entité</Label>
                  <p className="font-mono text-sm">{selectedLog.entityId}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Utilisateur</Label>
                  <p className="text-sm">
                    {selectedLog.userEmail ||
                      (selectedLog.user
                        ? `${selectedLog.user.email} (${selectedLog.user.firstName || ''} ${selectedLog.user.lastName || ''})`.trim()
                        : 'Système')}
                  </p>
                </div>
                <div>
                  <Label>Date</Label>
                  <p className="text-sm">
                    {new Date(selectedLog.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>

              {selectedLog.ipAddress && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Adresse IP</Label>
                    <p className="font-mono text-sm">{selectedLog.ipAddress}</p>
                  </div>
                  {selectedLog.userAgent && (
                    <div>
                      <Label>User Agent</Label>
                      <p className="text-xs text-gray-600 break-all">{selectedLog.userAgent}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedLog.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-sm">{selectedLog.description}</p>
                </div>
              )}

              {(selectedLog.oldValues || selectedLog.newValues) && (
                <div>
                  <Label>Modifications</Label>
                  {formatJsonDiff(selectedLog.oldValues, selectedLog.newValues)}
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
