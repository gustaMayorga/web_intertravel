import AppHeader from '@/components/layout/AppHeader';
// import BottomNav from '@/components/layout/BottomNav'; // BottomNav is no longer used
import WhatsAppButton from '@/components/layout/WhatsAppButton';

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen"> {/* Removed bg-background to let global body background show */}
      <AppHeader />
      <main className="flex-grow overflow-y-auto p-4 sm:p-6 relative"> {/* Added relative for potential overlay children */}
        <div className="container mx-auto max-w-4xl">
         {children}
        </div>
      </main>
      {/* <BottomNav /> */} {/* BottomNav removed from here */}
      <WhatsAppButton phoneNumber="+1234567890" message="Hola, necesito ayuda con ViajeroHub." />
    </div>
  );
}
