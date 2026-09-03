"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReminderOption {
  code: string;
  label: string;
}

export function ReminderPicker({
  options,
  defaultValues = [],
}: {
  options: readonly ReminderOption[];
  defaultValues?: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultValues));

  function toggle(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
        <Bell className="size-3.5 text-muted" />
        Recordatorios
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.has(opt.code);
          return (
            <label
              key={opt.code}
              className={cn(
                "cursor-pointer select-none rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border bg-surface text-muted hover:bg-surface-2"
              )}
            >
              <input
                type="checkbox"
                name="reminders"
                value={opt.code}
                checked={active}
                onChange={() => toggle(opt.code)}
                className="sr-only"
              />
              {opt.label}
            </label>
          );
        })}
      </div>
      {selected.size === 0 && (
        <p className="mt-1.5 text-xs text-muted">Sin recordatorios seleccionados.</p>
      )}
    </div>
  );
}
