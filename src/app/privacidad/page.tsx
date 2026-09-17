export const metadata = {
  title: "Privacidad — Operaciones",
};

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 text-sm leading-relaxed text-foreground">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Política de privacidad</h1>
      <p className="mt-2 text-muted">Última actualización: 11 de septiembre de 2026.</p>

      <p className="mt-6">
        Operaciones ("la aplicación") es un CRM para agencias de marketing y automatizaciones. Esta
        política describe qué datos recopilamos, para qué los usamos y cómo los protegemos.
      </p>

      <h2 className="mt-8 font-display text-lg font-semibold">Datos que recopilamos</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <li>
          <strong>Datos de la cuenta:</strong> nombre, email y contraseña (almacenada con hash, nunca en
          texto plano).
        </li>
        <li>
          <strong>Datos que ingresás vos:</strong> clientes, tareas, reuniones, cobros y notas que crees
          dentro de la aplicación.
        </li>
        <li>
          <strong>Datos de facturación:</strong> para las cuentas con suscripción paga, Mercado Pago procesa
          el pago y nos comparte un identificador de suscripción. Nunca vemos ni almacenamos el número de
          tu tarjeta.
        </li>
        <li>
          <strong>Notificaciones push:</strong> si las activás, guardamos el endpoint de suscripción de tu
          navegador o dispositivo para poder enviarte recordatorios.
        </li>
      </ul>

      <h2 className="mt-8 font-display text-lg font-semibold">Para qué usamos tus datos</h2>
      <p className="mt-3">
        Exclusivamente para operar la aplicación: mostrar tu información, enviarte los recordatorios que
        configurás y procesar el cobro de la suscripción. No vendemos ni compartimos tus datos con
        terceros para publicidad.
      </p>

      <h2 className="mt-8 font-display text-lg font-semibold">Dónde se almacenan los datos</h2>
      <p className="mt-3">
        La base de datos está alojada en Supabase (PostgreSQL) y la aplicación se ejecuta en Vercel. Los
        pagos se procesan a través de Mercado Pago. Estos proveedores actúan como encargados del
        tratamiento de datos bajo sus propias políticas de seguridad.
      </p>

      <h2 className="mt-8 font-display text-lg font-semibold">Cookies</h2>
      <p className="mt-3">
        Usamos una única cookie de sesión (httpOnly) para mantenerte identificado mientras usás la
        aplicación. No usamos cookies de seguimiento ni de publicidad.
      </p>

      <h2 className="mt-8 font-display text-lg font-semibold">Tus derechos</h2>
      <p className="mt-3">
        Podés pedir la corrección o eliminación de tu cuenta y tus datos en cualquier momento escribiendo a{" "}
        <a href="mailto:urielbarboza2020@gmail.com" className="text-accent hover:underline">
          urielbarboza2020@gmail.com
        </a>
        .
      </p>

      <h2 className="mt-8 font-display text-lg font-semibold">Contacto</h2>
      <p className="mt-3">
        Si tenés preguntas sobre esta política, escribinos a{" "}
        <a href="mailto:urielbarboza2020@gmail.com" className="text-accent hover:underline">
          urielbarboza2020@gmail.com
        </a>
        .
      </p>
    </div>
  );
}
