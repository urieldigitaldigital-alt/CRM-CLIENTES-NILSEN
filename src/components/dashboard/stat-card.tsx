import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "accent" | "success" | "warning" | "danger";
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-1 rounded-l-xl opacity-70 transition-opacity group-hover:opacity-100",
          barClasses[tone]
        )}
        aria-hidden
      />
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        <div
          className={cn(
            "flex size-7 items-center justify-center rounded-md transition-transform duration-200 group-hover:scale-105",
            toneClasses[tone]
          )}
        >
          <Icon className="size-3.5" />
        </div>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}

const toneClasses: Record<string, string> = {
  default: "bg-surface-2 text-muted",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

const barClasses: Record<string, string> = {
  default: "bg-muted",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};
