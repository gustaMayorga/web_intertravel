
"use client";

import NavLink from './NavLink';
import { Plane, Package, MessageSquare, ListChecks, UserCircle, LayoutDashboard, Info } from 'lucide-react'; // Added LayoutDashboard, Info

export default function BottomNav() {
  const navItems = [
    { href: '/dashboard', label: 'Inicio', Icon: LayoutDashboard },
    { href: '/flights', label: 'Vuelos', Icon: Plane },
    { href: '/packages', label: 'Paquetes', Icon: Package },
    { href: '/details', label: 'Detalles', Icon: Info }, // New Details Item
    { href: '/support', label: 'Soporte', Icon: MessageSquare },
    { href: '/checklist', label: 'Checklist', Icon: ListChecks },
    { href: '/profile', label: 'Perfil', Icon: UserCircle },
  ];

  return (
    <nav className="bg-card border-t border-border shadow-top sticky bottom-0 z-50">
      <div className="container mx-auto flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} Icon={item.Icon} />
        ))}
      </div>
    </nav>
  );
}
