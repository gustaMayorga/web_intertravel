import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp, getDoc, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig'; // User will create this file

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
const googleProvider = new GoogleAuthProvider(); // This can be initialized regardless

if (
  firebaseConfig &&
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "YOUR_API_KEY" && // Check against placeholder
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== "YOUR_PROJECT_ID" // Check against placeholder
) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("Firebase initialization error after checking config. This might be a network issue or an actual problem with valid-seeming credentials:", error);
    // app, auth, db will remain null
  }
} else {
  console.error(
    "******************************************************************************************\n" +
    "ERROR: Firebase configuration in 'src/firebase/firebaseConfig.js' is missing, incomplete, \n" +
    "or still uses placeholder values (e.g., YOUR_API_KEY).\n" +
    "Please update it with your actual Firebase project credentials.\n" +
    "Firebase features (like login, Firestore) will NOT be available until this is corrected.\n" +
    "The application might run in a degraded mode or fail on pages requiring Firebase.\n" +
    "******************************************************************************************"
  );
}

// Function to create or update user profile in Firestore
const createUserProfileDocument = async (userAuth: any) => {
  if (!userAuth) return;

  if (!db) {
    console.warn("Firestore (db) is not initialized. Skipping createUserProfileDocument. This is likely due to missing or incorrect Firebase config.");
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
    // Optionally, update last login time or other fields
    try {
      await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
    } catch (error) {
      console.error("Error updating user document in Firestore:", error);
    }
  }
  return userRef;
};


export { app, auth, db, googleProvider, createUserProfileDocument };
