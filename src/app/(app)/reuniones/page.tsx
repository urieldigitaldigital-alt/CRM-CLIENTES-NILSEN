import Link from "next/link";
import { Calendar as CalendarIcon, Plus, Link as LinkIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import type { Prisma } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/forms/form-dialog";
import { MeetingForm } from "@/components/forms/meeting-form";
import { MeetingRowActions } from "@/components/reuniones/meeting-row-actions";
import { formatDateTime, formatRelativeDay } from "@/lib/format";

export default async function ReunionesPage() {
  const user = await requireUser();

  const [meetings, clients] = await Promise.all([
    prisma.meeting.findMany({
      where: { userId: user.id },
      include: { client: true, reminders: true },
      orderBy: { date: "asc" },
    }),
    prisma.client.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, companyName: true },
      orderBy: { companyName: "asc" },
    }),
  ]);

  const now = new Date();
  const upcoming = meetings.filter((m) => m.date >= now);
  const past = meetings.filter((m) => m.date < now);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Reuniones</h1>
          <p className="mt-1 text-sm text-muted">{upcoming.length} próximas</p>
        </div>
        <FormDialog
          trigger={
            <Button className="gap-1.5">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Nueva reunión</span>
            </Button>
          }
          title="Nueva reunión"
        >
          <MeetingForm clients={clients} />
        </FormDialog>
      </div>

      {meetings.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <CalendarIcon className="size-8 text-muted" />
          <p className="font-medium">No hay reuniones agendadas</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <Section title="Próximas" meetings={upcoming} clients={clients} />
          )}
          {past.length > 0 && <Section title="Pasadas" meetings={past} clients={clients} muted />}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  meetings,
  clients,
  muted,
}: {
  title: string;
  meetings: Prisma.MeetingGetPayload<{ include: { client: true; reminders: true } }>[];
  clients: { id: string; name: string; companyName: string | null }[];
  muted?: boolean;
}) {
  return (
    <div>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h2>
      <div className="space-y-3">
        {meetings.map((m) => (
          <Card key={m.id} className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${muted ? "opacity-70" : ""}`}>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{m.title}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span>{formatRelativeDay(m.date)} · {formatDateTime(m.date)} · {m.durationMin} min</span>
                {m.client && (
                  <>
                    <span aria-hidden>·</span>
                    <Link href={`/clientes/${m.client.id}`} className="hover:text-accent">
                      {m.client.companyName ?? m.client.name}
                    </Link>
                  </>
                )}
                {m.reminders.length > 0 && <Badge variant="default">🔔 {m.reminders.length}</Badge>}
              </div>
              {m.meetingLink && (
                <a
                  href={m.meetingLink}
                  target="_blank"
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                >
                  <LinkIcon className="size-3" /> Unirse
                </a>
              )}
            </div>
            <MeetingRowActions meeting={m} clients={clients} />
          </Card>
        ))}
      </div>
    </div>
  );
}
