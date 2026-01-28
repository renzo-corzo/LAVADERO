/**
 * Componente Button moderno con CVA (Class Variance Authority)
 * Estilo 2026 con glassmorphism y sombras suaves
 */

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-blue-600 text-white hover:bg-blue-700 shadow-[0_4px_14px_0_rgba(37,99,235,0.4)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.5)] focus-visible:ring-blue-500',
        secondary:
          'bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-900 hover:bg-white/90 hover:border-gray-300 shadow-sm hover:shadow-md focus-visible:ring-gray-500',
        danger:
          'bg-red-600 text-white hover:bg-red-700 shadow-[0_4px_14px_0_rgba(220,38,38,0.4)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.5)] focus-visible:ring-red-500',
        ghost:
          'hover:bg-gray-100/80 hover:text-gray-900 focus-visible:ring-gray-500',
        outline:
          'border-2 border-gray-300 bg-transparent hover:bg-gray-50/80 focus-visible:ring-gray-500',
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-10 px-4 py-2 text-sm',
        lg: 'h-12 px-6 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

