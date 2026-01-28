/**
 * Componente Card moderno con glassmorphism
 * Estilo 2026 con efecto de cristal esmerilado
 */

import React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  actions?: React.ReactNode
  variant?: 'default' | 'glass'
}

export function Card({ 
  children, 
  className = '', 
  title, 
  actions,
  variant = 'default'
}: CardProps) {
  const baseStyles = variant === 'glass'
    ? 'bg-white/70 backdrop-blur-md border border-white/20 shadow-xl shadow-gray-900/5 rounded-xl'
    : 'bg-white shadow-lg rounded-xl border border-gray-100'
  
  return (
    <div className={cn(baseStyles, className)}>
      {(title || actions) && (
        <div className="px-6 py-4 border-b border-gray-200/50 flex justify-between items-center">
          {title && <h3 className="text-lg font-semibold text-gray-900 tracking-tight">{title}</h3>}
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
    </div>
  )
}




