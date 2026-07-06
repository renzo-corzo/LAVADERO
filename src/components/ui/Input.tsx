/**
 * Componente Input reutilizable
 */

import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  const baseStyles = 'block w-full px-3.5 py-2.5 bg-white border rounded-xl text-ink placeholder:text-muted/70 transition focus:outline-none focus:ring-2'
  const errorStyles = error
    ? 'border-danger/50 focus:ring-danger/40 focus:border-danger'
    : 'border-aqua-line focus:ring-brand/40 focus:border-brand'

  return (
    <div>
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-ink mb-1.5">
          {label}
          {props.required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <input
        className={`${baseStyles} ${errorStyles} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )
}





