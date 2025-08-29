/**
 * Composant DeleteConfirmDialog - Modal de confirmation de suppression
 * 
 * Fournit une interface sécurisée pour confirmer les suppressions
 * avec double vérification utilisateur et messages contextualiss.
 * 
 * Caractéristiques :
 * - Modal d'alerte avec boutons Annuler/Confirmer
 * - Messages personnalisables avec nom d'élément
 * - Bouton de déclenchement par défaut ou personnalisable
 * - Couleurs d'alerte (rouge) pour les actions destructives
 * - Prévention des suppressions accidentelles
 * 
 * Utilisé dans l'interface d'administration pour supprimer
 * zones, utilisateurs, et autres éléments critiques.
 * 
 * @param title Titre de la boîte de dialogue
 * @param description Description personnalisée (optionnel)
 * @param itemName Nom de l'élément à supprimer pour le message
 * @param onConfirm Callback exécuté lors de la confirmation
 * @param disabled Indique si la suppression est désactivée
 * @param trigger Élément déclencheur personnalisé (optionnel)
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */

"use client"

import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

/**
 * Props du composant DeleteConfirmDialog
 */
interface DeleteConfirmDialogProps {
  /** Titre de la boîte de dialogue */
  title?: string
  /** Description personnalisée */
  description?: string
  /** Nom de l'élément à supprimer */
  itemName?: string
  /** Callback de confirmation */
  onConfirm: () => void
  /** Indique si la suppression est désactivée */
  disabled?: boolean
  /** Élément déclencheur personnalisé */
  trigger?: React.ReactNode
}

export default function DeleteConfirmDialog({
  title = "Confirmer la suppression",
  description,
  itemName,
  onConfirm,
  disabled = false,
  trigger,
}: DeleteConfirmDialogProps) {
  const defaultDescription = itemName 
    ? `Êtes-vous sûr de vouloir supprimer "${itemName}" ? Cette action est irréversible.`
    : "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible."

  const finalDescription = description || defaultDescription

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button
            variant="destructive"
            size="sm"
            disabled={disabled}
            className="hover:bg-red-600"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Supprimer
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            {finalDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:flex-row sm:justify-end sm:space-x-2">
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Confirmer la suppression
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}