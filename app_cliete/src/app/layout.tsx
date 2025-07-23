
import type { Metadata, Viewport } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
import { NotificationProvider } from '@/contexts/notification-context';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: 'InterTravel | Tu App de Viajes Premium',
  description: 'Descubre destinos increíbles con InterTravel Group - Tour Operador EVyT 15.566',
  manifest: '/manifest.json',
  applicationName: 'InterTravel',
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "InterTravel",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  other: {
    'msapplication-config': '/icons/browserconfig.xml',
    'msapplication-TileColor': '#1e40af',
    'msapplication-tap-highlight': 'no',
  }
};

export const viewport: Viewport = {
  themeColor: '#121c2e', // Handles <meta name="theme-color">
  // minimumScale: 1,
  // initialScale: 1,
  // width: 'device-width',
  // userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${montserrat.variable} antialiased min-h-screen flex flex-col`}>
        <AuthProvider>
          <NotificationProvider>
            {children}
            <Toaster />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
