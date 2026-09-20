import { NextResponse } from "next/server";
import { effectiveResurface, type DueCard } from "@lemma/shared";
import { CORS_HEADERS, badRequest, corsPreflight, isResponse, requireUser } from "@/lib/api";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(req: Request) {
  const ctx = await requireUser(req);
  if (isResponse(ctx)) return ctx;

  const limit = Math.min(Number(new URL(req.url).searchParams.get("limit")) || 30, 100);

  const { data, error } = await ctx.supabase
    .from("srs_cards")
    .select("*, capture:captures(*)")
    .lte("due_at", new Date().toISOString())
    .order("due_at", { ascending: true })
    .limit(limit * 3);

  if (error) return badRequest(error.message);

  const due: DueCard[] = (data ?? [])
    .filter((row) => row.capture && effectiveResurface(row.capture) === "review")
    .map((row) => {
      const { capture, ...card } = row as typeof row & { capture: DueCard["capture"] };
      return { card, capture };
    })
    .slice(0, limit);

  return NextResponse.json({ due }, { headers: CORS_HEADERS });
}
