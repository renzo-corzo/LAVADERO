/**
 * Componente Select reutilizable
 */

import React from 'react'

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'placeholder'> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string // Placeholder se renderiza como opción deshabilitada
}

export function Select({ label, error, options = [], className = '', ...props }: SelectProps) {
  const baseStyles = 'block w-full px-3.5 py-2.5 bg-white border rounded-xl text-ink transition focus:outline-none focus:ring-2'
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
      <select
        className={`${baseStyles} ${errorStyles} ${className}`}
        {...props}
      >
        {props.placeholder && (
          <option value="" disabled>
            {props.placeholder}
          </option>
        )}
        {options && options.length > 0 && options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

