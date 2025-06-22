"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BriefcaseBusiness } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/firebase/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";


export default function LoginPage() {
  const router = useRouter();
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    if (!loading && currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, loading, router]);


  const handleGoogleLogin = async () => {
    if (!auth || !googleProvider) {
      console.error("Firebase Auth or Google Provider not initialized. Cannot sign in with Google. Please check Firebase configuration in src/firebase/firebaseConfig.js");
      // Optionally, show a user-facing error message here via a toast or an alert
      alert("Error de configuración: No se puede iniciar sesión con Google en este momento. Por favor, intente más tarde.");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged in AuthContext will handle redirection and profile creation
    } catch (error) {
      console.error("Error durante el inicio de sesión con Google:", error);
      // Aquí podrías mostrar un toast o mensaje de error al usuario
    }
  };

  if (loading || (!loading && currentUser)) {
    // Show a loading state or null while checking auth/redirecting
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            Cargando...
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <BriefcaseBusiness className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">ViajeroHub</h1>
          </Link>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Inicia sesión en tu cuenta
          </h2>
          <p className="text-sm text-muted-foreground">
            para acceder a tus viajes y planificación personalizada.
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl">Bienvenido</CardTitle>
            <CardDescription>
              Usa tu cuenta de Google para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full group hover:bg-secondary" onClick={handleGoogleLogin} disabled={!auth}>
              <svg className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                <path d="M1 1h22v22H1z" fill="none"/>
              </svg>
              Continuar con Google
            </Button>
            {!auth && (
              <p className="text-xs text-destructive text-center">La configuración de Firebase es incorrecta. El inicio de sesión está deshabilitado.</p>
            )}
          </CardContent>
        </Card>
        {/* Placeholder for sign-up link if needed in the future
        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link
            href="#" 
            className="font-medium text-primary hover:underline"
          >
            Regístrate
          </Link>
        </p> */}
      </div>
    </div>
  );
}
