import AppHeader from '@/components/layout/AppHeader';
// import BottomNav from '@/components/layout/BottomNav'; // BottomNav is no longer used
import WhatsAppButton from '@/components/layout/WhatsAppButton';

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-[-1]"
        style={{
          backgroundImage: 'url(/camboriu.jfif)',
          filter: 'brightness(0.3)' // Oscurecer para mejor legibilidad
        }}
      />
      
      {/* Overlay for better readability */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/40 via-transparent to-blue-800/30 z-[-1]" />
      
      <AppHeader />
      <main className="flex-grow overflow-y-auto p-4 sm:p-6 relative">
        <div className="container mx-auto max-w-4xl">
         {children}
        </div>
      </main>
      <WhatsAppButton phoneNumber="+5491134567890" message="Hola, estoy interesado en los paquetes de viaje de InterTravel. ¿Pueden ayudarme?" />
    </div>
  );
}
