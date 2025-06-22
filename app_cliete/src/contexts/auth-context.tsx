"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, createUserProfileDocument, db } from '@/firebase/firebase'; // db import might not be directly used here but auth depends on its successful init
import { useRouter } from 'next/navigation';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth) { // Check if Firebase auth is initialized
      console.warn("AuthContext: Firebase Auth is not initialized. Auth features will be disabled. Ensure firebaseConfig.js is correct.");
      setLoading(false);
      return () => {}; // Return an empty unsubscribe function
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Ensure db is also initialized before trying to create profile
        if (db) {
            await createUserProfileDocument(user);
        } else {
            console.warn("AuthContext: Firestore (db) is not initialized. Cannot create user profile.");
        }
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // router is not a dependency here

  const signOut = async () => {
    if (!auth) {
      console.warn("AuthContext: Firebase Auth is not initialized. Sign out is not possible.");
      return;
    }
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null); // Managed by onAuthStateChanged, but good for immediate UI update
      router.push('/login'); // Redirect to login after sign out
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const value = {
    currentUser,
    loading,
    signOut,
  };

  // Render children only when not loading, or if auth is null (meaning it didn't initialize)
  // This ensures children don't try to use Firebase features prematurely if auth failed to init
  return <AuthContext.Provider value={value}>{(!loading || !auth) && children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
