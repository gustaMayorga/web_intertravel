import TermsConditions from '@/components/legal/TermsConditions';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones | InterTravel - Condiciones de Uso',
  description: 'Lee los términos y condiciones de uso de InterTravel. Conoce tus derechos y responsabilidades al utilizar nuestros servicios de viajes.',
  keywords: 'términos condiciones, términos uso, condiciones viaje, InterTravel, agencia viajes legal',
  robots: 'index, follow',
  openGraph: {
    title: 'Términos y Condiciones - InterTravel',
    description: 'Conoce los términos que rigen nuestros servicios de agencia de viajes.',
    type: 'website',
    url: 'https://intertravel.com/terminos-condiciones',
  }
};

export default function TermsConditionsPage() {
  return <TermsConditions />;
}