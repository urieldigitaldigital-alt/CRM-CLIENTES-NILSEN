"use client";

import { useState, cloneElement, type ReactElement, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

export function FormDialog({
  trigger,
  title,
  description,
  children,
  locked = false,
}: {
  trigger: ReactElement<{ onClick?: (e: MouseEvent) => void }>;
  title: string;
  description?: string;
  children: ReactElement<{ onSuccess?: () => void }>;
  locked?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (locked) {
    return cloneElement(trigger, {
      onClick: (e: MouseEvent) => {
        e.preventDefault();
        router.push("/suscripcion");
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {cloneElement(children, { onSuccess: () => setOpen(false) })}
      </DialogContent>
    </Dialog>
  );
}
