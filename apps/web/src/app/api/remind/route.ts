import { NextResponse } from "next/server";
import type { Capture } from "@lemma/shared";
import { createServiceClient } from "@/lib/supabase/service";
import { sendReminderEmail } from "@/lib/email";

export const runtime = "nodejs";

const BATCH_SIZE = 200;

/**
 * Cron sweep: emails everyone whose capture hit its 3-day remind_at and
 * hasn't been reminded about yet. Vercel Cron issues GET requests and, when
 * CRON_SECRET is set as a project env var, automatically signs them with it.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: due, error } = await supabase
    .from("captures")
    .select("*")
    .eq("reminder_sent", false)
    .lte("remind_at", new Date().toISOString())
    .limit(BATCH_SIZE);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const captures = (due ?? []) as Capture[];
  const userIds = [...new Set(captures.map((c) => c.user_id))];

  const { data: profiles, error: profilesErr } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  if (profilesErr) return NextResponse.json({ error: profilesErr.message }, { status: 500 });

  const emailByUserId = new Map((profiles ?? []).map((p) => [p.id, p.email as string | null]));

  let sent = 0;
  const sentIds: string[] = [];

  for (const capture of captures) {
    const email = emailByUserId.get(capture.user_id);
    if (!email) continue;

    const ok = await sendReminderEmail(email, capture);
    if (ok) {
      sent++;
      sentIds.push(capture.id);
    }
  }

  if (sentIds.length > 0) {
    await supabase.from("captures").update({ reminder_sent: true }).in("id", sentIds);
  }

  return NextResponse.json({ checked: due?.length ?? 0, sent });
}
