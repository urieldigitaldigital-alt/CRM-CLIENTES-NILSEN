"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        onClick={() => setOpen(true)}
        className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground md:hidden"
        aria-label="Menú"
      >
        <Menu className="size-5" />
      </button>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Menú</DialogTitle>
        </DialogHeader>
        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  active ? "bg-accent-soft text-accent" : "text-foreground hover:bg-surface-2"
                )}
              >
                <Icon className="size-4.5" />
                {item.label}
              </Link>
            );
          })}
          <form action={logoutAction} className="mt-2 border-t border-border pt-2">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger-soft"
            >
              <LogOut className="size-4.5" />
              Cerrar sesión
            </button>
          </form>
        </nav>
      </DialogContent>
    </Dialog>
  );
}
