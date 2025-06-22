"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  href: string;
  label: string;
  Icon: LucideIcon;
}

export default function NavLink({ href, label, Icon }: NavLinkProps) {
  const pathname = usePathname();
  // Simplified active logic: a link is active if its href matches the current pathname.
  // This works well if the homepage redirects to /dashboard, making /dashboard the effective root for active state.
  const isActive = pathname === href;


  return (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-center justify-center p-2 rounded-md transition-colors w-1/4 sm:w-auto', // Adjusted width for responsiveness
        isActive ? 'text-primary scale-110 font-semibold' : 'text-muted-foreground hover:text-foreground'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className={cn("h-6 w-6 mb-0.5", isActive ? "text-primary" : "")} />
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}
