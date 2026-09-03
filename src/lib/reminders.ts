import { offsetMsFor } from "@/lib/constants";

export function computeRemindAt(eventDate: Date, offsetCode: string): Date {
  return new Date(eventDate.getTime() - offsetMsFor(offsetCode));
}

function humanizeOffset(code: string): string {
  const map: Record<string, string> = {
    "15m": "15 minutos",
    "30m": "30 minutos",
    "1h": "1 hora",
    "2h": "2 horas",
    "3h": "3 horas",
    "6h": "6 horas",
    "12h": "12 horas",
    "1d": "1 día",
    "7d": "7 días",
    "3d": "3 días",
    "0d": "hoy",
  };
  return map[code] ?? code;
}

export function taskReminderMessage(params: {
  offsetCode: string;
  title: string;
  clientName?: string | null;
}) {
  const when = params.offsetCode === "0d" ? "Hoy" : `En ${humanizeOffset(params.offsetCode)}`;
  const who = params.clientName ? ` para ${params.clientName}` : "";
  return {
    title: "⏰ Recordatorio de tarea",
    body: `${when} tenés que: ${params.title}${who}.`,
  };
}

export function meetingReminderMessage(params: {
  offsetCode: string;
  title: string;
  clientName?: string | null;
}) {
  const when = params.offsetCode === "0d" ? "Hoy" : `En ${humanizeOffset(params.offsetCode)}`;
  const who = params.clientName ? ` con ${params.clientName}` : "";
  return {
    title: "📅 Recordatorio de reunión",
    body: `${when} tenés la reunión "${params.title}"${who}.`,
  };
}

export function paymentReminderMessage(params: {
  offsetCode: string;
  clientName: string;
  amountLabel: string;
}) {
  if (params.offsetCode === "0d") {
    return {
      title: "💰 Cobro vence hoy",
      body: `${params.clientName} te tiene que pagar ${params.amountLabel} hoy.`,
    };
  }
  const when = humanizeOffset(params.offsetCode);
  return {
    title: "💰 Cobro próximo",
    body: `${params.clientName} te tiene que pagar ${params.amountLabel} en ${when}.`,
  };
}

export function paymentOverdueMessage(params: { clientName: string; amountLabel: string }) {
  return {
    title: "⚠️ Pago vencido",
    body: `${params.clientName} tiene un pago de ${params.amountLabel} vencido.`,
  };
}
