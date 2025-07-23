import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp, getDoc, type Firestore } from 'firebase/firestore';
import { firebaseConfig, FIREBASE_ENABLED, MOCK_MODE } from './firebaseConfig';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
const googleProvider = new GoogleAuthProvider();

// Solo inicializar Firebase si está habilitado y configurado correctamente
if (FIREBASE_ENABLED && firebaseConfig && 
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    firebaseConfig.apiKey !== "mock-api-key-for-development" &&
    firebaseConfig.projectId && 
    firebaseConfig.projectId !== "YOUR_PROJECT_ID" &&
    firebaseConfig.projectId !== "intertravel-mock") {
  
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    console.log(" Firebase initialized successfully.");
  } catch (error) {
    console.error(" Firebase initialization error:", error);
    app = null;
    auth = null;
    db = null;
  }
} else {
  if (MOCK_MODE) {
    console.log(" Firebase en modo MOCK - La app funciona sin Firebase");
    console.log(" Usando datos locales para desarrollo");
  } else {
    console.warn(
      "️ Firebase no configurado correctamente.\n" +
      "La app funcionará en modo local sin autenticación Firebase.\n" +
      "Para habilitar Firebase, configura firebaseConfig.js con credenciales reales."
    );
  }
}

// Mock function para desarrollo sin Firebase
const createUserProfileDocument = async (userAuth: any) => {
  if (!userAuth) return;

  if (!db) {
    if (MOCK_MODE) {
      console.log(" Mock: createUserProfileDocument - Firebase deshabilitado");
      return Promise.resolve(null);
    }
    console.warn("Firestore no disponible - función deshabilitada");
    return;
  }

  const userRef = doc(db, `users/${userAuth.uid}`);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { displayName, email, photoURL } = userAuth;
    const createdAt = serverTimestamp();
    try {
      await setDoc(userRef, {
        displayName,
        email,
        photoURL,
        createdAt,
        lastLoginAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error creating user document in Firestore:", error);
    }
  } else {
    try {
      await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
    } catch (error) {
      console.error("Error updating user document in Firestore:", error);
    }
  }
  return userRef;
};

// Export con información del estado
export { 
  app, 
  auth, 
  db, 
  googleProvider, 
  createUserProfileDocument,
  FIREBASE_ENABLED,
  MOCK_MODE 
};

// Log del estado para debugging
if (typeof window !== 'undefined') {
  console.log(" Firebase Status:", {
    enabled: FIREBASE_ENABLED,
    mockMode: MOCK_MODE,
    app: !!app,
    auth: !!auth,
    db: !!db
  });
}
