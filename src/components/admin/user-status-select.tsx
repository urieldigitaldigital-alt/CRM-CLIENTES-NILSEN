"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setUserStatusAction } from "@/actions/admin";
import { SUBSCRIPTION_STATUS_LABEL } from "@/lib/constants";
import { SubscriptionStatus } from "@prisma/client";

export function UserStatusSelect({ userId, status }: { userId: string; status: SubscriptionStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      defaultValue={status}
      disabled={isPending}
      onValueChange={(value) =>
        startTransition(async () => {
          await setUserStatusAction(userId, value as SubscriptionStatus);
          toast.success("Estado actualizado");
        })
      }
    >
      <SelectTrigger className="h-8 w-[140px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.values(SubscriptionStatus).map((s) => (
          <SelectItem key={s} value={s}>
            {SUBSCRIPTION_STATUS_LABEL[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
