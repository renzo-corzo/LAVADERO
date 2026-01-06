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




