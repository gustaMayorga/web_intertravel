"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { UploadCloud, BellRing, UserCircle2, LogIn, LogOut } from "lucide-react";
// import Image from "next/image"; // Not used after Avatar changes
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth as firebaseAuthChecker } from "@/firebase/firebase"; // For checking if auth is initialized

export default function ProfilePage() {
  const { currentUser, signOut, loading } = useAuth();

  const isAuthInitialized = !!firebaseAuthChecker;


  if (loading && isAuthInitialized) { // Only show full loading if auth is expected to work
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-3 mb-8">
          <UserCircle2 className="h-10 w-10 text-primary" />
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Perfil y Configuración</h2>
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
        <Card className="shadow-lg h-40 animate-pulse"></Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3 mb-8">
        <UserCircle2 className="h-10 w-10 text-primary" />
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Perfil y Configuración</h2>
          <p className="text-muted-foreground">Gestiona tus documentos de viaje y preferencias.</p>
        </div>
      </div>

      {!isAuthInitialized && (
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-destructive">Error de Configuración</CardTitle>
            <CardDescription className="text-destructive-foreground">
              La autenticación de Firebase no está configurada correctamente. Por favor, revisa el archivo `src/firebase/firebaseConfig.js`.
              Las funciones de perfil están deshabilitadas.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {isAuthInitialized && currentUser ? (
        <Card className="shadow-lg">
          <CardHeader className="flex flex-col sm:flex-row items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-accent">
                <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "Avatar de usuario"} data-ai-hint="avatar person" />
                <AvatarFallback className="text-2xl">
                    {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : <UserCircle2 className="h-1/2 w-1/2"/>}
                </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <CardTitle className="text-xl">{currentUser.displayName || "Usuario"}</CardTitle>
              <CardDescription>{currentUser.email}</CardDescription>
            </div>
          </CardHeader>
          <CardFooter className="flex justify-end">
            <Button variant="outline" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
            </Button>
          </CardFooter>
        </Card>
      ) : isAuthInitialized && !currentUser && !loading ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
            <CardDescription>Inicia sesión con tu cuenta de Google para acceder a todas las funciones.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" passHref>
              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                <LogIn className="mr-2 h-5 w-5" /> Iniciar Sesión con Google
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <Separator />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <UploadCloud className="mr-2 h-6 w-6 text-primary" /> Carga Segura de Documentos
          </CardTitle>
          <CardDescription>
            Sube tus documentos de viaje para tu coordinador. Formatos aceptados: PDF, JPG, PNG. Máx 5MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="travel-document">Documento de Viaje</Label>
            <Input id="travel-document" type="file" disabled={!currentUser || !isAuthInitialized} className="file:text-sm file:font-medium file:text-primary file:bg-primary/10 hover:file:bg-primary/20"/>
          </div>
          <p className="text-xs text-muted-foreground">
            Por seguridad, los documentos subidos están encriptados y solo son accesibles por personal autorizado.
          </p>
        </CardContent>
        <CardFooter>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={!currentUser || !isAuthInitialized}>
            <UploadCloud className="mr-2 h-4 w-4" /> Subir Documento
          </Button>
        </CardFooter>
      </Card>

      <Separator />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <BellRing className="mr-2 h-6 w-6 text-primary" /> Gestión de Alertas de Vuelo
          </CardTitle>
          <CardDescription>
            Personaliza tus recordatorios y notificaciones de vuelo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
            <Label htmlFor="global-alerts" className="font-medium">Habilitar Todas las Alertas de Vuelo</Label>
            <Switch id="global-alerts" defaultChecked disabled={!currentUser || !isAuthInitialized} aria-label="Habilitar todas las alertas de vuelo" />
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">Recordatorios de Próximos Vuelos:</h4>
            <p className="text-sm text-muted-foreground">
              Actualmente tienes alertas para el vuelo AC2024 a Londres. 
              (Esto es un marcador de posición. La gestión real de alertas de vuelo aparecerá aquí.)
            </p>
            <Button variant="outline" disabled={!currentUser || !isAuthInitialized}>Gestionar Alertas Específicas</Button>
          </div>
          <div>
            <Label htmlFor="reminder-time">Hora Preferida de Recordatorio Antes del Vuelo</Label>
            <Input id="reminder-time" type="number" placeholder="ej. 24 (horas)" disabled={!currentUser || !isAuthInitialized} className="mt-1"/>
            <p className="text-xs text-muted-foreground mt-1">Establece cuántas horas antes de tu vuelo deseas recibir un recordatorio.</p>
          </div>
        </CardContent>
        <CardFooter>
            <Button disabled={!currentUser || !isAuthInitialized}>Guardar Preferencias de Alerta</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
