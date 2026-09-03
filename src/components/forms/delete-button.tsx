"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function DeleteButton({
  action,
  confirmMessage,
  successMessage,
  className,
  label,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  successMessage: string;
  className?: string;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    startTransition(async () => {
      await action();
      toast.success(successMessage);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "flex items-center gap-2 text-danger disabled:opacity-50",
        className
      )}
    >
      <Trash2 className="size-4" />
      {label ?? "Eliminar"}
    </button>
  );
}
