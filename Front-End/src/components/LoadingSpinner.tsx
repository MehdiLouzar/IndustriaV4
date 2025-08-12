/**
 * Composant LoadingSpinner - Indicateur de chargement animé
 * 
 * Affiche un spinner rotatif avec message optionnel pour indiquer
 * les états de chargement dans l'interface utilisateur.
 * 
 * Tailles disponibles :
 * - sm : 24x24px - Pour les petits éléments
 * - md : 48x48px - Taille standard (par défaut)
 * - lg : 64x64px - Pour les chargements de page complète
 * 
 * Utilise les couleurs de la charte graphique Industria pour l'animation.
 * 
 * @param size Taille du spinner (sm, md, lg)
 * @param message Message à afficher sous le spinner
 * @param className Classes CSS supplémentaires
 * 
 * @author Industria Platform Team
 * @version 1.0
 * @since 1.0
 */

"use client";

import React from 'react';

/**
 * Props du composant LoadingSpinner
 */
interface LoadingSpinnerProps {
  /** Taille du spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Message d'information optionnel */
  message?: string;
  /** Classes CSS supplémentaires */
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className={`text-center py-8 ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-industria-brown-gold mx-auto mb-4 ${sizeClasses[size]}`}></div>
      {message && (
        <p className="text-gray-600 font-medium">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;