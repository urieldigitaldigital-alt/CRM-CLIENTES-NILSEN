import "server-only";
import { Resend } from "resend";

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function getClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY no está configurado en .env");
  return new Resend(key);
}

function getFrom() {
  return process.env.EMAIL_FROM ?? "Operaciones <onboarding@resend.dev>";
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const url = `${getAppUrl()}/verificar-email/${token}`;
  const resend = getClient();
  await resend.emails.send({
    from: getFrom(),
    to: email,
    subject: "Confirmá tu email — Operaciones",
    html: `
      <p>Hola ${name},</p>
      <p>Gracias por registrarte en Operaciones. Confirmá tu email haciendo clic en el siguiente enlace:</p>
      <p><a href="${url}">Verificar mi email</a></p>
      <p>Este enlace vence en 24 horas. Si no creaste esta cuenta, podés ignorar este mensaje.</p>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const url = `${getAppUrl()}/restablecer-contrasena/${token}`;
  const resend = getClient();
  await resend.emails.send({
    from: getFrom(),
    to: email,
    subject: "Restablecer tu contraseña — Operaciones",
    html: `
      <p>Hola ${name},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña. Hacé clic en el siguiente enlace para elegir una nueva:</p>
      <p><a href="${url}">Restablecer mi contraseña</a></p>
      <p>Este enlace vence en 1 hora. Si no pediste esto, podés ignorar este mensaje.</p>
    `,
  });
}
