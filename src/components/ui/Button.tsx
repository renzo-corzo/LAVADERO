/**
 * Componente Button moderno con CVA (Class Variance Authority)
 * Estilo 2026 con glassmorphism y sombras suaves
 */

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        // Acento de marca "Aqua": degradé turquesa → azul
        primary:
          'bg-gradient-to-br from-brand-teal to-brand-blue text-white shadow-brand hover:-translate-y-px hover:brightness-105',
        secondary:
          'bg-white border border-aqua-line text-ink hover:border-brand/40 hover:shadow-aqua',
        danger:
          'bg-danger text-white shadow-[0_10px_22px_-10px_rgba(232,99,95,0.7)] hover:brightness-105 focus-visible:ring-danger',
        ghost:
          'text-ink hover:bg-white/70',
        outline:
          'border border-aqua-line bg-transparent text-ink hover:bg-white/60',
      },
      size: {
        sm: 'h-9 px-3.5 text-xs',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-6 text-base',
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

