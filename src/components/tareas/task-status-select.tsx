"use client";

import { useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setTaskStatus } from "@/actions/tasks";
import { TASK_STATUS_LABEL } from "@/lib/constants";
import { TaskStatus } from "@prisma/client";

export function TaskStatusSelect({ taskId, status }: { taskId: string; status: TaskStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select
        defaultValue={status}
        disabled={isPending}
        onValueChange={(value) => startTransition(() => setTaskStatus(taskId, value as TaskStatus))}
      >
        <SelectTrigger className="h-8 w-[140px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.values(TaskStatus).map((s) => (
            <SelectItem key={s} value={s}>
              {TASK_STATUS_LABEL[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
