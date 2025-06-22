
"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Bell, LogIn, LogOut, UserCircle, Menu, Plane, Package, MessageSquare, ListChecks, Info, LayoutDashboard } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', Icon: LayoutDashboard },
  { href: '/flights', label: 'Vuelos', Icon: Plane },
  { href: '/packages', label: 'Paquetes', Icon: Package },
  { href: '/details', label: 'Detalles', Icon: Info },
  { href: '/support', label: 'Soporte', Icon: MessageSquare },
  { href: '/checklist', label: 'Checklist', Icon: ListChecks },
  { href: '/profile', label: 'Perfil', Icon: UserCircle },
];

export default function AppHeader() {
  const { currentUser, signOut, loading } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-primary text-primary-foreground p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <Image 
            src="/logo.jpg" 
            alt="ViajeroHub Logo" 
            width={120} 
            height={40}
            className="h-8 w-auto" 
            data-ai-hint="logo travel"
            priority 
          />
        </Link>
        
        {/* Desktop Navigation (hidden on small screens) */}
        <nav className="hidden md:flex gap-x-3 lg:gap-x-5 items-center mx-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors px-2 py-1 rounded-md",
                pathname === item.href ? "bg-accent text-accent-foreground" : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="sr-only">Notificaciones</span>
          </Button>

          {loading ? (
            <div className="h-8 w-24 bg-primary/50 animate-pulse rounded-md"></div>
          ) : currentUser ? (
            <>
              <Link href="/profile" className="flex items-center gap-2 text-primary-foreground hover:text-primary-foreground/80">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border-2 border-accent">
                  <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "Usuario"} data-ai-hint="avatar person" />
                  <AvatarFallback>
                    {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : <UserCircle className="h-full w-full" />}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm hidden lg:inline">{currentUser.displayName}</span>
              </Link>
              <Button onClick={signOut} variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80 hidden sm:inline-flex" title="Cerrar Sesión">
                <LogOut className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="sr-only">Cerrar Sesión</span>
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="outline" className="bg-accent text-accent-foreground hover:bg-accent/90 border-accent text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-auto">
                <LogIn className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Iniciar Sesión
              </Button>
            </Link>
          )}

          {/* Mobile Menu Trigger (visible on small screens) */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 bg-card text-card-foreground">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-border">
                  <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                    <Image src="/logo.jpg" alt="ViajeroHub Logo" width={120} height={40} className="h-8 w-auto" data-ai-hint="logo travel" />
                  </Link>
                </div>
                <nav className="flex-grow p-4 space-y-2">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-md p-3 text-base font-medium transition-colors",
                          pathname === item.href ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-secondary hover:text-secondary-foreground"
                        )}
                      >
                        <item.Icon className={cn("h-5 w-5", pathname === item.href ? "text-accent-foreground" : "text-muted-foreground group-hover:text-secondary-foreground")} />
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                   {currentUser && (
                    <SheetClose asChild>
                        <Button onClick={() => { signOut(); setIsMobileMenuOpen(false);}} variant="ghost" className="w-full justify-start flex items-center gap-3 rounded-md p-3 text-base font-medium text-destructive hover:bg-destructive/10 hover:text-destructive mt-4">
                            <LogOut className="h-5 w-5" />
                            Cerrar Sesión
                        </Button>
                    </SheetClose>
                   )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
