"use client";

import { RowActions } from "@/components/shared/row-actions";
import { MeetingForm } from "@/components/forms/meeting-form";
import type { ClientOption } from "@/components/forms/task-form";
import { deleteMeeting } from "@/actions/meetings";

interface MeetingDefaults {
  id: string;
  title: string;
  clientId: string | null;
  date: Date;
  durationMin: number;
  meetingLink: string | null;
  notes: string | null;
  reminders?: { offsetLabel: string }[];
}

export function MeetingRowActions({ meeting, clients }: { meeting: MeetingDefaults; clients: ClientOption[] }) {
  return (
    <RowActions
      editTitle="Editar reunión"
      editForm={
        <MeetingForm
          clients={clients}
          defaults={{ ...meeting, reminderOffsets: meeting.reminders?.map((r) => r.offsetLabel) }}
        />
      }
      deleteAction={() => deleteMeeting(meeting.id)}
      deleteConfirm={`¿Eliminar la reunión "${meeting.title}"?`}
      deleteSuccess="Reunión eliminada"
    />
  );
}
