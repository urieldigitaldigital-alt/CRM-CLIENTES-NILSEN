import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Users, CheckSquare, Calendar, Wallet, Bell, Settings } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  mobilePrimary?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, mobilePrimary: true },
  { href: "/clientes", label: "Clientes", icon: Users, mobilePrimary: true },
  { href: "/tareas", label: "Tareas", icon: CheckSquare, mobilePrimary: true },
  { href: "/calendario", label: "Calendario", icon: Calendar, mobilePrimary: true },
  { href: "/cobros", label: "Cobros", icon: Wallet, mobilePrimary: true },
  { href: "/notificaciones", label: "Notificaciones", icon: Bell },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];
