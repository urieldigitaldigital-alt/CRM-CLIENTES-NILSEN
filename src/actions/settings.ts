"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export type ProfileFormState = { error?: string } | undefined;

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const timezone = String(formData.get("timezone") ?? user.timezone);
  const dateFormat = String(formData.get("dateFormat") ?? user.dateFormat);

  if (!name || !email) return { error: "Nombre y email son obligatorios." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== user.id) return { error: "Ese email ya está en uso." };

  await prisma.user.update({
    where: { id: user.id },
    data: { name, email, timezone, dateFormat },
  });

  revalidatePath("/configuracion");
  return undefined;
}

export async function updateNotificationPrefs(_prevState: undefined, formData: FormData): Promise<undefined> {
  const user = await requireUser();
  await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    update: {
      pushEnabled: formData.get("pushEnabled") === "on",
      taskReminders: formData.get("taskReminders") === "on",
      meetingReminders: formData.get("meetingReminders") === "on",
      paymentReminders: formData.get("paymentReminders") === "on",
      defaultTaskReminder: String(formData.get("defaultTaskReminder") ?? "PT3H"),
      defaultMeetingReminder: String(formData.get("defaultMeetingReminder") ?? "PT2H"),
      defaultPaymentReminder: String(formData.get("defaultPaymentReminder") ?? "P1D"),
    },
    create: {
      userId: user.id,
      pushEnabled: formData.get("pushEnabled") === "on",
      taskReminders: formData.get("taskReminders") === "on",
      meetingReminders: formData.get("meetingReminders") === "on",
      paymentReminders: formData.get("paymentReminders") === "on",
    },
  });
  revalidatePath("/configuracion");
}
