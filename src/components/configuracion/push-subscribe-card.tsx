"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BellRing, BellOff, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getExistingSubscription,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push-client";

type Status = "checking" | "unsupported" | "denied" | "off" | "on";

export function PushSubscribeCard() {
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    if (!isPushSupported()) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    const sub = await getExistingSubscription();
    setStatus(sub ? "on" : "off");
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads async browser/service-worker state on mount
    refresh();
  }, []);

  async function handleToggle() {
    setBusy(true);
    try {
      if (status === "on") {
        await unsubscribeFromPush();
        toast.success("Notificaciones push desactivadas");
      } else {
        await subscribeToPush();
        toast.success("Notificaciones push activadas");
      }
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo activar las notificaciones");
    } finally {
      setBusy(false);
    }
  }

  async function handleTest() {
    setBusy(true);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo enviar la notificación de prueba");
      }
      toast.success("Notificación de prueba enviada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar la prueba");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Notificaciones push</CardTitle>
          <CardDescription>Recibí recordatorios reales en este dispositivo, incluso con la app cerrada.</CardDescription>
        </div>
        <StatusBadge status={status} />
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {status === "unsupported" && (
          <p className="text-sm text-muted">
            Este navegador no soporta notificaciones push. Probá con Chrome, Edge o instalando la app en Android.
          </p>
        )}
        {status === "denied" && (
          <p className="text-sm text-muted">
            Bloqueaste los permisos de notificación para este sitio. Habilitalos desde la configuración del navegador.
          </p>
        )}
        {(status === "on" || status === "off") && (
          <Button onClick={handleToggle} disabled={busy} variant={status === "on" ? "secondary" : "default"} className="gap-1.5">
            {status === "on" ? <BellOff className="size-4" /> : <BellRing className="size-4" />}
            {status === "on" ? "Desactivar" : "Activar notificaciones"}
          </Button>
        )}
        {status === "on" && (
          <Button onClick={handleTest} disabled={busy} variant="outline" className="gap-1.5">
            <Send className="size-3.5" />
            Enviar notificación de prueba
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "checking") return null;
  if (status === "on") return <Badge variant="success">Activadas</Badge>;
  if (status === "denied") return <Badge variant="danger">Bloqueadas</Badge>;
  if (status === "unsupported") return <Badge variant="default">No soportado</Badge>;
  return <Badge variant="warning">Desactivadas</Badge>;
}
