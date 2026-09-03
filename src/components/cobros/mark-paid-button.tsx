"use client";

import { useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markPaymentPaid } from "@/actions/payments";

export function MarkPaidButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-success hover:bg-success-soft"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await markPaymentPaid(id);
          toast.success("Pago marcado como cobrado");
        })
      }
    >
      <CheckCircle2 className="size-3.5" />
      Marcar pagado
    </Button>
  );
}
