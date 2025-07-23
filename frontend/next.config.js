/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@heroicons/react'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error']
    } : false
  },
  eslint: {
    ignoreDuringBuilds: false, // ✅ Cambiado para detectar errores
  },
  typescript: {
    ignoreBuildErrors: false, // ✅ Cambiado para detectar errores
  },
  images: {
    remotePatterns: [
      // ✅ CONFIGURACIÓN COMPLETA DE IMÁGENES
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      // Placeholder services
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      // Travel Compositor API
      {
        protocol: 'https',
        hostname: 'newapi.vpttours.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'online.travelcompositor.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.travelcompositor.com',
        port: '',
        pathname: '/**',
      },
      // Travel Compositor Storage
      {
        protocol: 'https',
        hostname: 'tr2storage.blob.core.windows.net',
        port: '',
        pathname: '/**',
      },
      // Para desarrollo local
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3002',
        pathname: '/uploads/**',
      },
    ],
    // Configuración adicional para mejor rendimiento
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

module.exports = nextConfig;