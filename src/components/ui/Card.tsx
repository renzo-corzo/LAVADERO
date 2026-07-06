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
    ? 'bg-white/70 backdrop-blur-md border border-white/40 shadow-aqua-lg rounded-2xl'
    : 'bg-white shadow-aqua rounded-2xl border border-aqua-line'

  return (
    <div className={cn(baseStyles, className)}>
      {(title || actions) && (
        <div className="px-6 py-4 border-b border-aqua-line flex justify-between items-center">
          {title && <h3 className="text-lg font-semibold text-ink tracking-tight">{title}</h3>}
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
    </div>
  )
}




