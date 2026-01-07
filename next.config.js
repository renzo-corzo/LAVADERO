const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configuración PWA básica
  // Nota: Para PWA completa, usar next-pwa o similar
  images: {
    domains: [],
  },
  webpack: (config) => {
    // Asegura que el alias '@' resuelva a 'src' en todos los entornos (incl. Render)
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
    }
    return config
  },
}

module.exports = nextConfig




