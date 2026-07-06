/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'var(--font-inter)',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      // ===== Sistema de diseño "Aqua" =====
      colors: {
        brand: {
          teal: '#0fb5b0',
          blue: '#1f7ae0',
          DEFAULT: '#1f7ae0',
          dark: '#155fb0',
        },
        ink: '#0f2f38', // texto principal (tinta con sesgo turquesa)
        muted: '#5c7883', // texto secundario
        aqua: {
          bg: '#f2f7f9', // fondo base
          line: '#e2edf0', // bordes / divisores
        },
        // Colores semánticos (separados del acento de marca)
        ok: '#12b886',
        warn: '#f0a92c',
        danger: '#e8635f',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.2)',
        // Sombras suaves del sistema Aqua
        'aqua': '0 12px 30px -22px rgba(15, 47, 56, 0.45)',
        'aqua-lg': '0 18px 40px -20px rgba(15, 47, 56, 0.5)',
        'brand': '0 10px 22px -10px rgba(31, 122, 224, 0.7)',
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}





