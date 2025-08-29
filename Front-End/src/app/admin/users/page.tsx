'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSecureApi, useSecureMutation } from '@/hooks/use-api'
import { secureApiRequest } from '@/lib/auth-actions'
import Pagination from '@/components/Pagination'
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog'
import type { ListResponse } from '@/types'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

interface User {
  id: string
  email: string
  name: string
  role: string
  company?: string
  phone?: string
  isActive?: boolean
  zoneCount?: number
}

const roles = ['ADMIN', 'MANAGER', 'USER']

export default function UsersAdmin() {
  const router = useRouter()
  const [items, setItems] = useState<User[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const itemsPerPage = 10
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<User & { password?: string }>({
    id: '',
    email: '',
    name: '',
    role: 'USER',
    company: '',
    phone: '',
    isActive: true,
    password: '',
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)


  const load = useCallback(async (page = currentPage, search = searchTerm) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: itemsPerPage.toString()
    })
    
    if (search.trim()) {
      params.append('search', search.trim())
    }
    
    const { data: response, error } = await secureApiRequest<ListResponse<User>>(
      `/api/users?${params.toString()}`
    )
    
    if (error) {
      console.error('Error loading users:', error)
      return
    }
    
    if (response && Array.isArray(response.items)) {
      setItems(response.items)
      setTotalPages(response.totalPages ?? 1)
      setCurrentPage(response.page ?? 1)
    } else if (Array.isArray(response)) {
      setItems(response as User[])
      setTotalPages(1)
      setCurrentPage(1)
    } else {
      setItems([])
      setTotalPages(1)
      setCurrentPage(1)
    }
  }, [currentPage, itemsPerPage, searchTerm])
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }
    }
    load(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, router])

  // Effet pour la recherche
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1) // Retour à la page 1 lors d'une recherche
      load(1, searchTerm)
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm, load])

  // Fonction de validation
  const validateForm = async () => {
    const newErrors: Record<string, string> = {}
    
    // Validation de l'email
    if (!form.email.trim()) {
      newErrors.email = 'L\'adresse email est obligatoire'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Format d\'email invalide'
    }
    
    // Validation du nom
    if (!form.name.trim()) {
      newErrors.name = 'Le nom est obligatoire'
    } else if (form.name.length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères'
    }
    
    // Validation du téléphone (optionnel mais format si renseigné)
    if (form.phone && !/^(\+212|0)[567]\d{8}$/.test(form.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Format de téléphone marocain invalide (ex: +212 6 XX XX XX XX)'
    }
    
    // Validation du mot de passe (obligatoire pour création, optionnel pour modification)
    if (!form.id && (!form.password || form.password.length < 8)) {
      newErrors.password = 'Le mot de passe est obligatoire et doit contenir au moins 8 caractères'
    } else if (form.password && form.password.length > 0 && form.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères'
    }
    
    // Validation de la société (optionnel mais longueur si renseigné)
    if (form.company && form.company.length < 2) {
      newErrors.company = 'Le nom de société doit contenir au moins 2 caractères'
    }
    
    // Vérification d'unicité de l'email
    if (form.email && !newErrors.email && !form.id) {
      const { data: response, error } = await secureApiRequest(`/api/users/check-email?email=${encodeURIComponent(form.email)}`)
      if (error) {
        console.warn('Erreur lors de la vérification d\'unicité de l\'email:', error)
      } else if (response && response.exists) {
        newErrors.email = 'Un utilisateur avec cette adresse email existe déjà'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    
    // Effacer l'erreur pour ce champ lors de la saisie
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }, [errors])

  const handleRole = useCallback((value: string) => {
    setForm((f) => ({ ...f, role: value }))
  }, [])

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    
    try {
      // Validation du formulaire
      const isValid = await validateForm()
      if (!isValid) {
        setIsSubmitting(false)
        return
      }

      const body = {
        email: form.email.trim().toLowerCase(),
        name: form.name.trim(),
        role: form.role,
        company: form.company?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        isActive: form.isActive,
        password: form.password || undefined,
      }
      
      if (form.id) {
        const { error } = await secureApiRequest(`/api/users/${form.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        })
        if (error) {
          throw new Error('Error updating user')
        }
      } else {
        const { error } = await secureApiRequest('/api/users', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        })
        if (error) {
          throw new Error('Error creating user')
        }
      }
      
      setForm({
        id: '',
        email: '',
        name: '',
        role: 'USER',
        company: '',
        phone: '',
        isActive: true,
        password: '',
      })
      setErrors({})
      setOpen(false)
      load(currentPage)
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      setErrors({ submit: 'Erreur lors de la sauvegarde. Veuillez réessayer.' })
    } finally {
      setIsSubmitting(false)
    }
  }, [form, load, validateForm])

  const edit = useCallback((it: User) => {
    setForm({
      id: it.id,
      email: it.email,
      name: it.name,
      role: it.role,
      company: it.company ?? '',
      phone: it.phone ?? '',
      isActive: it.isActive ?? true,
      password: '',
    })
    setErrors({})
    setOpen(true)
  }, [])
  
  const del = useCallback(async (id: string) => {
    const { error } = await secureApiRequest(`/api/users/${id}`, { method: 'DELETE' })
    if (error) {
      console.error('Error deleting user:', error)
    } else {
      load(currentPage)
    }
  }, [load, currentPage])

  const addNew = useCallback(() => {
    setForm({
      id: '',
      email: '',
      name: '',
      role: 'USER',
      company: '',
      phone: '',
      isActive: true,
      password: '',
    })
    setErrors({})
    setOpen(true)
  }, [])


  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-xl font-bold">Utilisateurs</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Rechercher par email, nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button onClick={addNew}>Ajouter</Button>
        </div>
      </div>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Email</th>
                <th className="p-2">Rôle</th>
                <th className="p-2">Société</th>
                <th className="p-2">Zones</th>
                <th className="p-2 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(items) ? items : []).map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="p-2 align-top">{u.email}</td>
                  <td className="p-2 align-top">{u.role}</td>
                  <td className="p-2 align-top">{u.company}</td>
                  <td className="p-2 align-top">{u.zoneCount ?? 0}</td>
                  <td className="p-2 space-x-2 whitespace-nowrap">
                    <Button size="sm" onClick={() => edit(u)}>Éditer</Button>
                    <DeleteConfirmDialog
                      itemName={u.email}
                      onConfirm={() => del(u.id)}
                      description={`Êtes-vous sûr de vouloir supprimer l'utilisateur "${u.email}" ? Cette action est irréversible et supprimera tous les rendez-vous et associations liés.`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination
          totalItems={totalPages * itemsPerPage}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? 'Modifier' : 'Nouvel utilisateur'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                {errors.submit}
              </div>
            )}
            
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email" 
                name="email" 
                type="email"
                value={form.email} 
                onChange={handleChange} 
                required 
                className={errors.email ? 'border-red-500' : ''}
                placeholder="utilisateur@entreprise.com"
              />
              {errors.email && <span className="text-red-500 text-sm mt-1">{errors.email}</span>}
            </div>
            
            <div>
              <Label htmlFor="name">Nom *</Label>
              <Input 
                id="name" 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                required 
                className={errors.name ? 'border-red-500' : ''}
                placeholder="Nom complet de l'utilisateur"
              />
              {errors.name && <span className="text-red-500 text-sm mt-1">{errors.name}</span>}
            </div>
            
            <div>
              <Label htmlFor="company">Société</Label>
              <Input 
                id="company" 
                name="company" 
                value={form.company} 
                onChange={handleChange}
                className={errors.company ? 'border-red-500' : ''}
                placeholder="Nom de l'entreprise (optionnel)"
              />
              {errors.company && <span className="text-red-500 text-sm mt-1">{errors.company}</span>}
            </div>
            
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input 
                id="phone" 
                name="phone" 
                type="tel"
                value={form.phone} 
                onChange={handleChange}
                className={errors.phone ? 'border-red-500' : ''}
                placeholder="+212 6 XX XX XX XX (optionnel)"
              />
              {errors.phone && <span className="text-red-500 text-sm mt-1">{errors.phone}</span>}
            </div>
            
            <div>
              <Label htmlFor="role">Rôle *</Label>
              <Select value={form.role} onValueChange={handleRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((r) => r && r.trim() !== "")
                    .map((r) => (
                      <SelectItem key={r} value={r}>
                        {r === 'ADMIN' ? 'Administrateur' : 
                         r === 'MANAGER' ? 'Gestionnaire' : 
                         'Utilisateur'}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                id="isActive" 
                name="isActive" 
                type="checkbox" 
                checked={form.isActive} 
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })} 
                className="rounded"
              />
              <Label htmlFor="isActive">Compte actif</Label>
            </div>
            
            <div>
              <Label htmlFor="password">
                Mot de passe {!form.id ? '*' : '(laisser vide pour ne pas modifier)'}
              </Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                value={form.password || ''} 
                onChange={handleChange}
                className={errors.password ? 'border-red-500' : ''}
                placeholder={form.id ? "Nouveau mot de passe (optionnel)" : "Au moins 8 caractères"}
                minLength={8}
              />
              {errors.password && <span className="text-red-500 text-sm mt-1">{errors.password}</span>}
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setOpen(false)
                  setErrors({})
                }}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Enregistrement...' : (form.id ? 'Mettre à jour' : 'Créer')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}