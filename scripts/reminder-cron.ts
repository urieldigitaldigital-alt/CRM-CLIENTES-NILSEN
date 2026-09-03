import "dotenv/config";
import cron from "node-cron";
import { runReminderSweep } from "../src/lib/reminder-sweep";

async function tick() {
  const startedAt = new Date().toISOString();
  try {
    const result = await runReminderSweep();
    if (result.remindersSent > 0 || result.paymentsMarkedOverdue > 0) {
      console.log(`[${startedAt}] recordatorios enviados: ${result.remindersSent}, pagos vencidos: ${result.paymentsMarkedOverdue}`);
    }
  } catch (err) {
    console.error(`[${startedAt}] error en el sweep de recordatorios:`, err);
  }
}

console.log("Cron de recordatorios corriendo cada minuto. Ctrl+C para detener.");
tick();
cron.schedule("* * * * *", tick);
