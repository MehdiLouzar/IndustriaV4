"use client"

import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  className?: string
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
  }

  return (
    <div className={`text-center py-8 ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-industria-brown-gold mx-auto mb-4 ${sizeClasses[size]}`}></div>
      {message && (
        <p className="text-gray-600 font-medium">{message}</p>
      )}
    </div>
  )
}

export default LoadingSpinner