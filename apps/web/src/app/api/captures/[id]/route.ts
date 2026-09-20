import { NextResponse } from "next/server";
import type { UpdateCaptureInput } from "@lemma/shared";
import { CORS_HEADERS, badRequest, corsPreflight, isResponse, requireUser } from "@/lib/api";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsPreflight();
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireUser(req);
  if (isResponse(ctx)) return ctx;
  const { id } = await params;

  let body: UpdateCaptureInput;
  try {
    body = (await req.json()) as UpdateCaptureInput;
  } catch {
    return badRequest("invalid json");
  }

  const patch: Record<string, unknown> = {};
  for (const key of ["user_note", "capture_type", "explanation", "dictionary_definition", "encyclopedic_summary", "space_id", "resurface", "remind_at", "reminder_sent"] as const) {
    if (key in body) patch[key] = body[key];
  }
  if (Object.keys(patch).length === 0) return badRequest("no updatable fields");
  if ("user_note" in patch) patch.user_note = String(patch.user_note ?? "").trim() || null;
  if ("resurface" in patch && patch.resurface !== null && !["review", "revisit", "keep"].includes(String(patch.resurface))) {
    return badRequest("resurface must be review, revisit or keep");
  }
  if ("remind_at" in patch && Number.isNaN(Date.parse(String(patch.remind_at)))) {
    return badRequest("remind_at must be a date");
  }

  const { data, error } = await ctx.supabase
    .from("captures")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error?.code === "PGRST116") {
    // RLS hid the row (not the author) or it doesn't exist — same response either way.
    return NextResponse.json({ error: "not found" }, { status: 404, headers: CORS_HEADERS });
  }
  if (error) return badRequest(error.message);
  return NextResponse.json({ capture: data }, { headers: CORS_HEADERS });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireUser(req);
  if (isResponse(ctx)) return ctx;
  const { id } = await params;

  // .select() so we can tell "deleted" from "RLS matched nothing" (not the author).
  const { data, error } = await ctx.supabase.from("captures").delete().eq("id", id).select("id, image_path");
  if (error) return badRequest(error.message);
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404, headers: CORS_HEADERS });
  }

  const imagePath = data[0]?.image_path;
  if (imagePath) {
    // Best-effort: the row is already gone either way, this just frees storage.
    await ctx.supabase.storage.from("captures").remove([imagePath]);
  }

  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
