/**
 * Utilidades generales
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina clases CSS usando clsx y tailwind-merge
 * Permite mergear clases de Tailwind de forma inteligente
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatear moneda
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount)
}

/**
 * Formatear fecha y hora
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d)
}

/**
 * Formatear solo hora (HH:MM)
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
}

/**
 * Formatear horario deseado: solo hora si es el mismo día, fecha completa si es otro día
 */
export function formatHorarioDeseado(horarioDeseado: Date | string, fechaIngreso: Date | string): string {
  const horario = typeof horarioDeseado === 'string' ? new Date(horarioDeseado) : horarioDeseado
  const ingreso = typeof fechaIngreso === 'string' ? new Date(fechaIngreso) : fechaIngreso
  
  const esMismoDia = 
    horario.getDate() === ingreso.getDate() &&
    horario.getMonth() === ingreso.getMonth() &&
    horario.getFullYear() === ingreso.getFullYear()
  
  if (esMismoDia) {
    return formatTime(horario)
  } else {
    return formatDateTime(horario)
  }
}

/**
 * Formatear fecha
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
  }).format(d)
}

/**
 * Calcular tiempo transcurrido
 */
export function getTimeElapsed(startDate: Date | string): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const now = new Date()
  const diffMs = now.getTime() - start.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  
  if (diffMins < 60) {
    return `${diffMins} min`
  }
  return `${diffHours}h ${diffMins % 60}min`
}

