// ===============================================
// FIREBASE CONFIG - MODO DESARROLLO/MOCK
// ===============================================
// Firebase está deshabilitado para development
// La app funciona sin Firebase usando mock data

// Configuración mock para desarrollo (no funcional pero evita errores)
export const firebaseConfig = {
  apiKey: "mock-api-key-for-development",
  authDomain: "intertravel-mock.firebaseapp.com",
  projectId: "intertravel-mock",
  storageBucket: "intertravel-mock.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:mock-app-id",
  measurementId: "G-MOCK123456"
};

// Flag para indicar que estamos en modo mock
export const FIREBASE_ENABLED = false;
export const MOCK_MODE = true;

console.log("🔧 Firebase en modo MOCK para desarrollo");
console.log("📱 La app funciona sin Firebase - usando datos locales");
