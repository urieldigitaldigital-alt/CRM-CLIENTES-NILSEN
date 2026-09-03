import type { ClientStatus, Priority, TaskStatus, PaymentStatus } from "@prisma/client";

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  PROSPECTO: "Prospecto",
  CERRADO: "Cerrado",
  ACTIVO: "Activo",
  PAUSADO: "Pausado",
  FINALIZADO: "Finalizado",
};

export const CLIENT_STATUS_BADGE: Record<ClientStatus, "default" | "accent" | "success" | "warning" | "danger" | "info"> = {
  PROSPECTO: "info",
  CERRADO: "accent",
  ACTIVO: "success",
  PAUSADO: "warning",
  FINALIZADO: "default",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

export const PRIORITY_BADGE: Record<Priority, "default" | "accent" | "success" | "warning" | "danger" | "info"> = {
  BAJA: "default",
  MEDIA: "info",
  ALTA: "warning",
  URGENTE: "danger",
};

export const PRIORITY_ORDER: Record<Priority, number> = {
  URGENTE: 0,
  ALTA: 1,
  MEDIA: 2,
  BAJA: 3,
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En progreso",
  COMPLETADA: "Completada",
};

export const TASK_STATUS_BADGE: Record<TaskStatus, "default" | "accent" | "success" | "warning" | "danger" | "info"> = {
  PENDIENTE: "warning",
  EN_PROGRESO: "info",
  COMPLETADA: "success",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDIENTE: "Pendiente",
  PAGADO: "Pagado",
  VENCIDO: "Vencido",
};

export const PAYMENT_STATUS_BADGE: Record<PaymentStatus, "default" | "accent" | "success" | "warning" | "danger" | "info"> = {
  PENDIENTE: "warning",
  PAGADO: "success",
  VENCIDO: "danger",
};

// Offset options for task/meeting reminders.
export const TASK_REMINDER_OPTIONS = [
  { code: "15m", label: "15 minutos antes", ms: 15 * 60_000 },
  { code: "30m", label: "30 minutos antes", ms: 30 * 60_000 },
  { code: "1h", label: "1 hora antes", ms: 60 * 60_000 },
  { code: "2h", label: "2 horas antes", ms: 2 * 60 * 60_000 },
  { code: "3h", label: "3 horas antes", ms: 3 * 60 * 60_000 },
  { code: "6h", label: "6 horas antes", ms: 6 * 60 * 60_000 },
  { code: "12h", label: "12 horas antes", ms: 12 * 60 * 60_000 },
  { code: "1d", label: "1 día antes", ms: 24 * 60 * 60_000 },
] as const;

// Offset options for payment reminders.
export const PAYMENT_REMINDER_OPTIONS = [
  { code: "7d", label: "7 días antes", ms: 7 * 24 * 60 * 60_000 },
  { code: "3d", label: "3 días antes", ms: 3 * 24 * 60 * 60_000 },
  { code: "1d", label: "1 día antes", ms: 24 * 60 * 60_000 },
  { code: "0d", label: "El mismo día", ms: 0 },
] as const;

export type ReminderOffsetCode =
  | (typeof TASK_REMINDER_OPTIONS)[number]["code"]
  | (typeof PAYMENT_REMINDER_OPTIONS)[number]["code"];

export function offsetMsFor(code: string): number {
  const found =
    TASK_REMINDER_OPTIONS.find((o) => o.code === code) ??
    PAYMENT_REMINDER_OPTIONS.find((o) => o.code === code);
  return found?.ms ?? 0;
}

export function offsetLabelFor(code: string): string {
  const found =
    TASK_REMINDER_OPTIONS.find((o) => o.code === code) ??
    PAYMENT_REMINDER_OPTIONS.find((o) => o.code === code);
  return found?.label ?? code;
}
