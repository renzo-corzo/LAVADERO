/**
 * Utilidades para manejo de fechas sin problemas de zona horaria
 */

/**
 * Obtiene la fecha local en formato YYYY-MM-DD (sin problemas de zona horaria)
 */
export function obtenerFechaLocal(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Crea una fecha a partir de un string YYYY-MM-DD en la zona horaria local
 */
export function crearFechaLocal(fechaStr: string): Date {
  const [year, month, day] = fechaStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Inicio del día (00:00:00.000) LOCAL para un YYYY-MM-DD (o ISO con fecha).
 * Evita el bug de `new Date("YYYY-MM-DD")` que interpreta la fecha como UTC.
 */
export function inicioDelDiaLocal(fechaStr: string): Date {
  const [year, month, day] = fechaStr.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

/**
 * Fin del día (23:59:59.999) LOCAL para un YYYY-MM-DD (o ISO con fecha).
 */
export function finDelDiaLocal(fechaStr: string): Date {
  const [year, month, day] = fechaStr.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day, 23, 59, 59, 999)
}





