import { NextRequest, NextResponse } from "next/server";
import { runReminderSweep } from "@/lib/reminder-sweep";

// Called every minute by a scheduler. Locally that's scripts/reminder-cron.ts;
// in production this is the endpoint a Vercel Cron Job or Supabase Edge
// Function (pg_cron) hits instead — same logic, different trigger.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const result = await runReminderSweep();
  return NextResponse.json(result);
}
