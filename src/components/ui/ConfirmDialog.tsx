/**
 * Diálogo de confirmación reutilizable.
 *
 * Reemplaza al confirm() nativo con una API imperativa y accesible:
 *
 *   const confirm = useConfirm()
 *   if (!(await confirm({ title: '¿Eliminar?', variant: 'danger' }))) return
 *
 * Montar <ConfirmProvider> una sola vez cerca de la raíz de la app.
 */

'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Button } from './Button'

export interface ConfirmOptions {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary'
}

type ConfirmFn = (options?: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

/** Devuelve una función `confirm(options) => Promise<boolean>`. */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>')
  }
  return ctx
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((opts = {}) => {
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const cerrar = useCallback((value: boolean) => {
    resolverRef.current?.(value)
    resolverRef.current = null
    setOptions(null)
  }, [])

  // Cerrar con Escape mientras el diálogo está abierto
  useEffect(() => {
    if (!options) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [options, cerrar])

  const esDanger = options?.variant === 'danger'

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => cerrar(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-title" className="text-lg font-bold text-gray-900">
              {options.title ?? '¿Confirmar acción?'}
            </h2>
            {options.description && (
              <p className="mt-2 text-sm text-gray-600">{options.description}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => cerrar(false)}>
                {options.cancelText ?? 'Cancelar'}
              </Button>
              <Button
                variant={esDanger ? 'danger' : 'primary'}
                onClick={() => cerrar(true)}
                autoFocus
              >
                {options.confirmText ?? 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
