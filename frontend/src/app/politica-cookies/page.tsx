import CookiePolicy from '@/components/legal/CookiePolicy';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Cookies | InterTravel - Gestión de Cookies',
  description: 'Información completa sobre las cookies que utilizamos en InterTravel. Gestiona tus preferencias de cookies y conoce cómo mejorar tu experiencia.',
  keywords: 'política cookies, gestión cookies, consentimiento, InterTravel, privacidad web',
  robots: 'index, follow',
  openGraph: {
    title: 'Política de Cookies - InterTravel',
    description: 'Controla tus cookies y personaliza tu experiencia de navegación.',
    type: 'website',
    url: 'https://intertravel.com/politica-cookies',
  }
};

export default function CookiePolicyPage() {
  return <CookiePolicy />;
}