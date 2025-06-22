// Configuración para conectar a nuestro backend InterTravel
export const backendConfig = {
  // URLs del backend
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://api.intertravel.com.ar' 
    : 'http://localhost:3002',
  
  // Endpoints principales
  endpoints: {
    auth: '/api/auth',
    packages: '/api/packages',
    bookings: '/api/bookings',
    payments: '/api/payments',
    profile: '/api/user/profile',
    notifications: '/api/notifications'
  },
  
  // Configuración de timeout
  timeout: 10000,
  
  // Headers por defecto
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Helper para construir URLs completas
export const buildAPIUrl = (endpoint: string) => {
  return `${backendConfig.baseURL}${endpoint}`;
};

// Configuración de Firebase (mantener para notificaciones push)
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "intertravel-app.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "intertravel-app",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "intertravel-app.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
};