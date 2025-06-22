import PrivacyPolicy from '@/components/legal/PrivacyPolicy';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad | InterTravel - Agencia de Viajes',
  description: 'Conoce cómo protegemos tu información personal en InterTravel. Política de privacidad completa y transparente para nuestros servicios de viajes.',
  keywords: 'política privacidad, protección datos, GDPR, InterTravel, seguridad información',
  robots: 'index, follow',
  openGraph: {
    title: 'Política de Privacidad - InterTravel',
    description: 'Tu privacidad es nuestra prioridad. Conoce cómo manejamos tu información personal.',
    type: 'website',
    url: 'https://intertravel.com/politica-privacidad',
  }
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicy />;
}