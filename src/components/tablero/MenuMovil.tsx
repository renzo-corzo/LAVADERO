'use client'

import Link from 'next/link'

interface MenuItem {
  href: string
  label: string
  icon: string
  color: string
}

interface MenuMovilProps {
  items: MenuItem[]
  mostrarKanban: boolean
}

export function MenuMovil({ items, mostrarKanban }: MenuMovilProps) {
  // Este componente es completamente puro, no usa hooks de estado ni efectos
  // Recibe todo lo necesario como props
  // Siempre renderiza el mismo HTML y usa CSS para ocultarlo cuando mostrarKanban es true

  return (
    <div className={`lg:hidden min-h-screen bg-gray-50 -mx-4 sm:-mx-6 -mt-8 ${mostrarKanban ? 'hidden' : ''}`}>
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Menú Principal</h1>
          <p className="text-gray-600 mt-1">Selecciona una opción</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                ${item.color} text-white rounded-xl p-6 
                flex flex-col items-center justify-center 
                min-h-[140px] shadow-lg hover:shadow-xl active:shadow-md
                transition-all duration-200 active:scale-95
                touch-manipulation
              `}
            >
              <span className="text-5xl mb-3">{item.icon}</span>
              <span className="text-base font-semibold text-center">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

