import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.intertravel.app',
  appName: 'InterTravel',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#121c2e',
      showSpinner: false
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#b38144',
      sound: 'beep.wav'
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#121c2e'
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK'
    },
    Camera: {
      permissions: {
        camera: 'Esta app necesita acceso a la cámara para tomar fotos de documentos de viaje',
        photos: 'Esta app necesita acceso a las fotos para adjuntar documentos'
      }
    },
    Geolocation: {
      permissions: {
        location: 'Esta app usa tu ubicación para ofrecerte viajes cercanos y experiencias locales'
      }
    }
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;