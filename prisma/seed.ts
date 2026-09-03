import { PrismaClient, Priority, ClientStatus, TaskStatus, PaymentStatus, ActivityType, ReminderTargetType, NotificationType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const BA_OFFSET_HOURS = 3; // America/Argentina/Buenos_Aires is UTC-3 year round (no DST)

function todayInBA(): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [y, m, d] = parts.split("-").map(Number);
  return { y, m, d };
}

/** Builds the UTC instant for a given Buenos Aires wall-clock date/time. */
function baTime(dayOffset: number, hour: number, minute = 0): Date {
  const { y, m, d } = todayInBA();
  return new Date(Date.UTC(y, m - 1, d + dayOffset, hour + BA_OFFSET_HOURS, minute));
}

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@agencia.com" },
    update: {},
    create: {
      name: "Uriel Barboza",
      email: "demo@agencia.com",
      password: passwordHash,
      timezone: "America/Argentina/Buenos_Aires",
      dateFormat: "DD/MM/YYYY",
      notificationPrefs: { create: {} },
    },
  });

  console.log(`Usuario demo: demo@agencia.com / demo1234 (id ${user.id})`);

  // ---------- Clients ----------
  const fitness = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Marcela Ibáñez",
      companyName: "Fitness Studio Norte",
      whatsapp: "+54 9 11 4455-2233",
      email: "marcela@fitnessstudionorte.com",
      instagram: "@fitnessstudionorte",
      website: "https://fitnessstudionorte.com.ar",
      service: "Gestión de redes + Meta Ads",
      price: 350000,
      paymentMethod: "Transferencia",
      status: ClientStatus.ACTIVO,
      startDate: baTime(-95, 10),
      nextPaymentDate: baTime(-5, 10),
      notes: "Prefiere reportes los lunes. Contacto directo por WhatsApp.",
    },
  });

  const parrilla = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Diego Fernández",
      companyName: "Restaurante La Parrilla",
      whatsapp: "+54 9 11 3322-1188",
      email: "diego@laparrilla.com.ar",
      instagram: "@laparrilla.ok",
      service: "Campañas Meta Ads",
      price: 280000,
      paymentMethod: "MercadoPago",
      status: ClientStatus.ACTIVO,
      startDate: baTime(-40, 9),
      nextPaymentDate: baTime(1, 10),
      notes: "Quiere foco en promos de fin de semana.",
    },
  });

  const juanPerez = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Juan Pérez",
      companyName: "PyME Soluciones",
      whatsapp: "+54 9 351 555-0199",
      email: "juan.perez@pymesoluciones.com",
      website: "https://pymesoluciones.com",
      service: "Automatización para PyME",
      price: 500000,
      paymentMethod: "Transferencia",
      status: ClientStatus.ACTIVO,
      startDate: baTime(-10, 9),
      nextPaymentDate: baTime(38, 0),
      notes: "Automatización de carga de pedidos + seguimiento de leads por WhatsApp.",
    },
  });

  const clinica = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Dra. Laura Gómez",
      companyName: "Clínica Dental Sonrisas",
      whatsapp: "+54 9 11 2211-9090",
      email: "laura@clinicasonrisas.com",
      instagram: "@clinicasonrisas",
      status: ClientStatus.PROSPECTO,
      notes: "Reunión de diagnóstico agendada. Evaluando presupuesto para Ads + web.",
    },
  });

  const boutique = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Sofía Torres",
      companyName: "Boutique Bella",
      whatsapp: "+54 9 11 6677-4433",
      instagram: "@boutiquebella.ar",
      service: "Gestión de redes",
      price: 150000,
      status: ClientStatus.PAUSADO,
      startDate: baTime(-200, 9),
      notes: "Pausado por temporada baja. Retomar en octubre.",
    },
  });

  const ecommerce = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Martín Acosta",
      companyName: "ModaYa E-commerce",
      email: "martin@modaya.com",
      service: "Ads + Email marketing",
      price: 400000,
      status: ClientStatus.FINALIZADO,
      startDate: baTime(-300, 9),
      notes: "Proyecto finalizado, buenos resultados. Posible retorno a futuro.",
    },
  });

  const contable = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Ricardo Rivas",
      companyName: "Estudio Contable Rivas",
      email: "ricardo@rivascontable.com",
      service: "Automatización de facturación",
      price: 420000,
      status: ClientStatus.CERRADO,
      startDate: baTime(-25, 9),
      closedAt: baTime(-25, 9),
      notes: "Cierre reciente. Onboarding programado para la semana que viene.",
    },
  });

  // ---------- Notes ----------
  await prisma.note.createMany({
    data: [
      { clientId: fitness.id, userId: user.id, content: "Pidió agregar Reels semanales al plan." },
      { clientId: juanPerez.id, userId: user.id, content: "Definir alcance de la automatización de stock para la fase 2." },
      { clientId: clinica.id, userId: user.id, content: "Enviar propuesta con 3 planes antes del viernes." },
    ],
  });

  // ---------- Tasks (with reminders) ----------
  async function createTaskWithReminders(params: {
    title: string;
    description?: string;
    clientId?: string;
    date: Date;
    priority: Priority;
    status?: TaskStatus;
    offsets: string[];
  }) {
    const task = await prisma.task.create({
      data: {
        userId: user.id,
        clientId: params.clientId,
        title: params.title,
        description: params.description,
        date: params.date,
        priority: params.priority,
        status: params.status ?? TaskStatus.PENDIENTE,
      },
    });
    for (const code of params.offsets) {
      const ms = OFFSET_MS[code] ?? 0;
      await prisma.reminder.create({
        data: {
          targetType: ReminderTargetType.TASK,
          taskId: task.id,
          offsetLabel: code,
          remindAt: new Date(params.date.getTime() - ms),
        },
      });
    }
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        clientId: params.clientId,
        taskId: task.id,
        type: ActivityType.TAREA_CREADA,
        message: `Tarea creada: ${params.title}`,
      },
    });
    return task;
  }

  const OFFSET_MS: Record<string, number> = {
    "15m": 15 * 60_000,
    "30m": 30 * 60_000,
    "1h": 60 * 60_000,
    "2h": 2 * 60 * 60_000,
    "3h": 3 * 60 * 60_000,
    "6h": 6 * 60 * 60_000,
    "12h": 12 * 60 * 60_000,
    "1d": 24 * 60 * 60_000,
    "7d": 7 * 24 * 60 * 60_000,
    "3d": 3 * 24 * 60 * 60_000,
    "0d": 0,
  };

  await createTaskWithReminders({
    title: "Llamada de seguimiento",
    description: "Repasar resultados de la última campaña.",
    clientId: fitness.id,
    date: baTime(0, 9, 0),
    priority: Priority.ALTA,
    offsets: ["30m"],
  });

  await createTaskWithReminders({
    title: "Crear campaña de promos de fin de semana",
    clientId: parrilla.id,
    date: baTime(0, 11, 30),
    priority: Priority.MEDIA,
    status: TaskStatus.EN_PROGRESO,
    offsets: ["1h"],
  });

  await createTaskWithReminders({
    title: "Preparar estructura para campaña",
    description: "Definir públicos, creativos y presupuesto por etapa.",
    clientId: juanPerez.id,
    date: baTime(0, 14, 0),
    priority: Priority.URGENTE,
    offsets: ["1d", "3h", "30m"],
  });

  await createTaskWithReminders({
    title: "Armar propuesta comercial",
    clientId: clinica.id,
    date: baTime(0, 16, 0),
    priority: Priority.MEDIA,
    offsets: ["2h"],
  });

  await createTaskWithReminders({
    title: "Preparar estructura para campaña",
    clientId: parrilla.id,
    date: baTime(2, 17, 0),
    priority: Priority.ALTA,
    offsets: ["3h"],
  });

  await createTaskWithReminders({
    title: "Revisar automatización de stock",
    clientId: juanPerez.id,
    date: baTime(1, 10, 0),
    priority: Priority.MEDIA,
    offsets: ["1h"],
  });

  await createTaskWithReminders({
    title: "Enviar reporte mensual",
    clientId: boutique.id,
    date: baTime(3, 9, 0),
    priority: Priority.BAJA,
    offsets: ["1d"],
  });

  // A near-future reminder so `npm run cron` visibly fires during a demo.
  const demoTask = await createTaskWithReminders({
    title: "Probar sistema de recordatorios",
    description: "Tarea de demostración: dispara un recordatorio real en minutos.",
    date: new Date(Date.now() + 3 * 60_000),
    priority: Priority.URGENTE,
    offsets: [],
  });
  await prisma.reminder.create({
    data: {
      targetType: ReminderTargetType.TASK,
      taskId: demoTask.id,
      offsetLabel: "2m",
      remindAt: new Date(Date.now() + 60_000),
    },
  });

  // ---------- Meetings ----------
  async function createMeetingWithReminders(params: {
    title: string;
    clientId?: string;
    date: Date;
    durationMin?: number;
    meetingLink?: string;
    notes?: string;
    offsets: string[];
  }) {
    const meeting = await prisma.meeting.create({
      data: {
        userId: user.id,
        clientId: params.clientId,
        title: params.title,
        date: params.date,
        durationMin: params.durationMin ?? 30,
        meetingLink: params.meetingLink,
        notes: params.notes,
      },
    });
    for (const code of params.offsets) {
      const ms = OFFSET_MS[code] ?? 0;
      await prisma.reminder.create({
        data: {
          targetType: ReminderTargetType.MEETING,
          meetingId: meeting.id,
          offsetLabel: code,
          remindAt: new Date(params.date.getTime() - ms),
        },
      });
    }
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        clientId: params.clientId,
        meetingId: meeting.id,
        type: ActivityType.REUNION_CREADA,
        message: `Reunión creada: ${params.title}`,
      },
    });
    return meeting;
  }

  await createMeetingWithReminders({
    title: "Reunión mensual de resultados",
    clientId: fitness.id,
    date: baTime(0, 17, 0),
    durationMin: 45,
    meetingLink: "https://meet.google.com/abc-defg-hij",
    offsets: ["2h"],
  });

  await createMeetingWithReminders({
    title: "Diagnóstico inicial",
    clientId: clinica.id,
    date: baTime(1, 12, 0),
    durationMin: 30,
    meetingLink: "https://meet.google.com/xyz-mnop-qrs",
    offsets: ["1d", "1h"],
  });

  await createMeetingWithReminders({
    title: "Onboarding de automatización",
    clientId: contable.id,
    date: baTime(4, 15, 0),
    durationMin: 60,
    meetingLink: "https://meet.google.com/rst-uvwx-yz1",
    offsets: ["1d"],
  });

  // ---------- Payments ----------
  async function createPaymentWithReminders(params: {
    clientId: string;
    service?: string;
    amount: number;
    contractedDate?: Date;
    dueDate: Date;
    status: PaymentStatus;
    paidDate?: Date;
    paymentMethod?: string;
    notes?: string;
    offsets: string[];
  }) {
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        clientId: params.clientId,
        service: params.service,
        amount: params.amount,
        contractedDate: params.contractedDate,
        dueDate: params.dueDate,
        status: params.status,
        paidDate: params.paidDate,
        paymentMethod: params.paymentMethod,
        notes: params.notes,
      },
    });
    for (const code of params.offsets) {
      const ms = OFFSET_MS[code] ?? 0;
      const remindAt = new Date(params.dueDate.getTime() - ms);
      await prisma.reminder.create({
        data: {
          targetType: ReminderTargetType.PAYMENT,
          paymentId: payment.id,
          offsetLabel: code,
          remindAt,
          sentAt: remindAt < new Date() ? remindAt : null,
        },
      });
    }
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        clientId: params.clientId,
        paymentId: payment.id,
        type: params.status === PaymentStatus.PAGADO ? ActivityType.PAGO_COBRADO : ActivityType.PAGO_REGISTRADO,
        message:
          params.status === PaymentStatus.PAGADO
            ? `Pago registrado como cobrado: $${params.amount.toLocaleString("es-AR")}`
            : `Pago pendiente registrado: $${params.amount.toLocaleString("es-AR")}`,
      },
    });
    return payment;
  }

  await createPaymentWithReminders({
    clientId: juanPerez.id,
    service: "Automatización para PyME",
    amount: 500000,
    contractedDate: baTime(-10, 9),
    dueDate: baTime(38, 0),
    status: PaymentStatus.PENDIENTE,
    paymentMethod: "Transferencia",
    offsets: ["7d", "1d"],
  });

  await createPaymentWithReminders({
    clientId: parrilla.id,
    service: "Campañas Meta Ads",
    amount: 280000,
    contractedDate: baTime(-40, 9),
    dueDate: baTime(1, 10),
    status: PaymentStatus.PENDIENTE,
    paymentMethod: "MercadoPago",
    offsets: ["3d", "1d", "0d"],
  });

  await createPaymentWithReminders({
    clientId: fitness.id,
    service: "Gestión de redes + Meta Ads",
    amount: 350000,
    contractedDate: baTime(-95, 9),
    dueDate: baTime(-5, 10),
    status: PaymentStatus.VENCIDO,
    paymentMethod: "Transferencia",
    notes: "Recordar por WhatsApp, ya venció.",
    offsets: ["3d", "1d", "0d"],
  });

  await createPaymentWithReminders({
    clientId: contable.id,
    service: "Automatización de facturación (adelanto)",
    amount: 210000,
    contractedDate: baTime(-25, 9),
    dueDate: baTime(-20, 9),
    status: PaymentStatus.PAGADO,
    paidDate: baTime(-19, 11),
    paymentMethod: "Transferencia",
    offsets: [],
  });

  await createPaymentWithReminders({
    clientId: boutique.id,
    service: "Gestión de redes",
    amount: 150000,
    contractedDate: baTime(-200, 9),
    dueDate: baTime(15, 9),
    status: PaymentStatus.PENDIENTE,
    paymentMethod: "Efectivo",
    offsets: ["7d", "1d"],
  });

  // ---------- Notifications (in-app center) ----------
  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        type: NotificationType.TASK,
        title: "⏰ Recordatorio de tarea",
        body: `En 3 horas tenés que: Preparar estructura para campaña para ${juanPerez.companyName}.`,
        link: `/tareas`,
        read: false,
      },
      {
        userId: user.id,
        type: NotificationType.MEETING,
        title: "📅 Recordatorio de reunión",
        body: `En 5 horas tenés la reunión "Diagnóstico inicial" con ${clinica.companyName}.`,
        link: `/calendario`,
        read: false,
      },
      {
        userId: user.id,
        type: NotificationType.PAYMENT_UPCOMING,
        title: "💰 Cobro próximo",
        body: `${juanPerez.name} te tiene que pagar $500.000 mañana.`,
        link: `/cobros`,
        read: false,
      },
      {
        userId: user.id,
        type: NotificationType.PAYMENT_OVERDUE,
        title: "⚠️ Pago vencido",
        body: `${fitness.name} tiene un pago de $350.000 vencido.`,
        link: `/cobros`,
        read: true,
      },
      {
        userId: user.id,
        type: NotificationType.GENERAL,
        title: "✅ Cliente cerrado",
        body: `${contable.companyName} pasó a estado Cerrado.`,
        link: `/clientes/${contable.id}`,
        read: true,
      },
    ],
  });

  // ---------- Activity: client lifecycle ----------
  for (const c of [fitness, parrilla, juanPerez, clinica, boutique, ecommerce, contable]) {
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        clientId: c.id,
        type: ActivityType.CLIENTE_CREADO,
        message: `Cliente creado: ${c.companyName ?? c.name}`,
        createdAt: c.startDate ?? new Date(),
      },
    });
  }
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      clientId: contable.id,
      type: ActivityType.CLIENTE_CERRADO,
      message: `${contable.companyName} pasó a estado Cerrado`,
    },
  });

  console.log("Seed completo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
