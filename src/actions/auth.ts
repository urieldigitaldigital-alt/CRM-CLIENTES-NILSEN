"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

function generateToken() {
  return randomBytes(32).toString("hex");
}

export type LoginState = { error?: string; unverifiedEmail?: string } | undefined;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Completá email y contraseña." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Email o contraseña incorrectos." };
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return { error: "Email o contraseña incorrectos." };
  }

  if (!user.emailVerifiedAt) {
    return {
      error: "Tenés que verificar tu email antes de ingresar. Revisá tu bandeja de entrada.",
      unverifiedEmail: user.email,
    };
  }

  await createSession(user.id);
  redirect(from.startsWith("/") ? from : "/dashboard");
}

export type RegisterState = { error?: string } | undefined;

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    return { error: "Completá nombre, email y contraseña." };
  }
  if (password.length < 8) {
    return { error: "La contraseña tiene que tener al menos 8 caracteres." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Ya existe una cuenta con ese email." };
  }

  const token = generateToken();
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: await hashPassword(password),
      emailVerificationToken: token,
      emailVerificationExpiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
      notificationPrefs: { create: {} },
    },
  });

  try {
    await sendVerificationEmail(user.email, user.name, token);
  } catch {
    await prisma.user.delete({ where: { id: user.id } });
    return { error: "No pudimos enviar el email de verificación. Probá de nuevo en un momento." };
  }

  redirect(`/verificar-email/pendiente?email=${encodeURIComponent(user.email)}`);
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export type ResendVerificationState = { error?: string; sent?: boolean } | undefined;

export async function resendVerificationAction(
  _prevState: ResendVerificationState,
  formData: FormData
): Promise<ResendVerificationState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { error: "Falta el email." };

  const user = await prisma.user.findUnique({ where: { email } });
  // Don't leak whether the account exists or is already verified.
  if (!user || user.emailVerifiedAt) return { sent: true };

  const token = generateToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: token,
      emailVerificationExpiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
    },
  });

  try {
    await sendVerificationEmail(user.email, user.name, token);
  } catch {
    return { error: "No pudimos reenviar el email. Probá de nuevo en un momento." };
  }

  return { sent: true };
}

export type RequestPasswordResetState = { sent?: boolean; error?: string } | undefined;

export async function requestPasswordResetAction(
  _prevState: RequestPasswordResetState,
  formData: FormData
): Promise<RequestPasswordResetState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { error: "Ingresá tu email." };

  const user = await prisma.user.findUnique({ where: { email } });
  // Always report success so we don't reveal which emails have accounts.
  if (!user) return { sent: true };

  const token = generateToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: token,
      passwordResetExpiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });

  try {
    await sendPasswordResetEmail(user.email, user.name, token);
  } catch {
    return { error: "No pudimos enviar el email. Probá de nuevo en un momento." };
  }

  return { sent: true };
}

export type ResetPasswordState = { error?: string } | undefined;

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!token) return { error: "Enlace inválido." };
  if (password.length < 8) {
    return { error: "La contraseña tiene que tener al menos 8 caracteres." };
  }

  const user = await prisma.user.findUnique({ where: { passwordResetToken: token } });
  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
    return { error: "Este enlace venció o no es válido. Solicitá uno nuevo." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await hashPassword(password),
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    },
  });

  redirect("/login?reset=success");
}
