import type {NextConfig} from 'next';
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  //  REMOVIDO: skipWaiting: true, - Esta propiedad no existe en esta versión del plugin
  //  Configuración PWA válida:
  workboxOptions: {
    disableDevLogs: true,
  },
  // Enable additional PWA features as needed
  // swSrc: "src/service-worker.js", // if you want to use a custom service worker
});

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    //  TEMPORAL: Removeremos esto después de corregir los errores
    ignoreBuildErrors: false, //  Cambiado para detectar errores
  },
  eslint: {
    ignoreDuringBuilds: false, //  Cambiado para detectar errores
  },
  images: {
    remotePatterns: [
      // Unsplash - Para imágenes mock y ejemplos
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      // Placeholder service
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // VPT Tours API - Travel Compositor
      {
        protocol: 'https',
        hostname: 'newapi.vpttours.com',
        port: '',
        pathname: '/**',
      },
      // Travel Compositor images
      {
        protocol: 'https',
        hostname: 'online.travelcompositor.com',
        port: '',
        pathname: '/**',
      },
      // Otros servicios de imágenes comunes
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
      // Para cualquier subdominio de Travel Compositor
      {
        protocol: 'https',
        hostname: '*.travelcompositor.com',
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

export default withPWA(nextConfig);