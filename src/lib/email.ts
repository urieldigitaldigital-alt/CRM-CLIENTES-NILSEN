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

function renderEmail({
  preheader,
  heading,
  body,
  ctaLabel,
  ctaUrl,
  footnote,
}: {
  preheader: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  footnote: string;
}) {
  const logoUrl = `${getAppUrl()}/icons/icon-192.png`;
  return `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${heading}</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f6f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f6fb;padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(20,21,31,0.08);">
              <tr>
                <td align="center" style="padding:36px 40px 8px;">
                  <img src="${logoUrl}" width="56" height="56" alt="Operaciones" style="display:block;border-radius:12px;" />
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:8px 40px 0;">
                  <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.02em;color:#6c5ce7;text-transform:uppercase;">Operaciones</p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:12px 40px 0;">
                  <h1 style="margin:0;font-size:22px;line-height:1.3;color:#14151f;font-weight:700;">${heading}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 40px 0;">
                  <div style="font-size:15px;line-height:1.6;color:#3a3b47;">${body}</div>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:28px 40px 8px;">
                  <a href="${ctaUrl}" style="display:inline-block;background-color:#6c5ce7;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 28px;border-radius:10px;">${ctaLabel}</a>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:8px 40px 32px;">
                  <p style="margin:0;font-size:12px;line-height:1.5;color:#9a9db0;word-break:break-all;">Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br /><a href="${ctaUrl}" style="color:#6c5ce7;">${ctaUrl}</a></p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 40px;border-top:1px solid #eceeF5;">
                  <p style="margin:0;font-size:12px;line-height:1.6;color:#9a9db0;">${footnote}</p>
                </td>
              </tr>
            </table>
            <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
              <tr>
                <td align="center" style="padding:20px 16px 0;">
                  <p style="margin:0;font-size:12px;color:#a5a8ba;">© ${new Date().getFullYear()} Operaciones. Todos los derechos reservados.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const url = `${getAppUrl()}/verificar-email/${token}`;
  const resend = getClient();
  const firstName = name.split(" ")[0];
  await resend.emails.send({
    from: getFrom(),
    to: email,
    subject: "Confirmá tu cuenta de Operaciones",
    html: renderEmail({
      preheader: "Confirmá tu email para activar tu cuenta de Operaciones.",
      heading: `¡Hola, ${firstName}! 👋`,
      body: `
        <p style="margin:0 0 12px;">Gracias por registrarte en <strong>Operaciones</strong>. Ya casi estás listo para empezar a gestionar tus clientes, tareas y cobros en un solo lugar.</p>
        <p style="margin:0;">Confirmá que esta es tu dirección de email para activar tu cuenta.</p>
      `,
      ctaLabel: "Confirmar mi email",
      ctaUrl: url,
      footnote: "Este enlace vence en 24 horas. Si no creaste una cuenta en Operaciones, podés ignorar este mensaje con total tranquilidad — no se activará nada sin tu confirmación.",
    }),
  });
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const url = `${getAppUrl()}/restablecer-contrasena/${token}`;
  const resend = getClient();
  const firstName = name.split(" ")[0];
  await resend.emails.send({
    from: getFrom(),
    to: email,
    subject: "Restablecé tu contraseña de Operaciones",
    html: renderEmail({
      preheader: "Recibimos una solicitud para restablecer tu contraseña.",
      heading: `Hola, ${firstName}`,
      body: `
        <p style="margin:0 0 12px;">Recibimos una solicitud para restablecer la contraseña de tu cuenta de <strong>Operaciones</strong>.</p>
        <p style="margin:0;">Elegí una nueva contraseña haciendo clic en el siguiente botón.</p>
      `,
      ctaLabel: "Restablecer mi contraseña",
      ctaUrl: url,
      footnote: "Este enlace vence en 1 hora. Si no pediste este cambio, podés ignorar este mensaje — tu contraseña actual seguirá funcionando sin cambios.",
    }),
  });
}
