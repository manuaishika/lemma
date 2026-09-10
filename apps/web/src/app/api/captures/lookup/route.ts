import { NextResponse } from "next/server";
import type { VaultLookup } from "@lemma/shared";
import { CORS_HEADERS, badRequest, corsPreflight, isResponse, requireUser } from "@/lib/api";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsPreflight();
}

/**
 * text -> { id, user_note } for the whole vault. Used later by the extension's
 * re-encounter detection to underline saved words while browsing. Term
 * captures only — screenshots/links/notes don't have a single word to match.
 */
export async function GET(req: Request) {
  const ctx = await requireUser(req);
  if (isResponse(ctx)) return ctx;

  const { data, error } = await ctx.supabase
    .from("captures")
    .select("id, text, user_note")
    .eq("capture_type", "term");

  if (error) return badRequest(error.message);

  const lookup: VaultLookup = {};
  for (const row of data) {
    const key = row.text.toLowerCase();
    if (!lookup[key]) lookup[key] = { id: row.id, user_note: row.user_note };
  }
  return NextResponse.json({ lookup }, { headers: CORS_HEADERS });
}
