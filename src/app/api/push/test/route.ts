import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

export async function POST() {
  const user = await requireUser();
  const result = await sendPushToUser(user.id, {
    title: "🔔 Notificación de prueba",
    body: "Así se van a ver tus recordatorios reales.",
    url: "/notificaciones",
    tag: "test",
  });

  if (result.sent === 0) {
    return NextResponse.json(
      { error: "No hay dispositivos suscriptos o el envío falló." },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true, sent: result.sent });
}
