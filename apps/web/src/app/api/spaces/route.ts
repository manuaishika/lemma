import { NextResponse } from "next/server";
import type { CreateSpaceInput } from "@lemma/shared";
import { CORS_HEADERS, badRequest, corsPreflight, isResponse, requireUser } from "@/lib/api";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsPreflight();
}

/** Spaces you belong to (owner or invited member) — RLS already scopes this. */
export async function GET(req: Request) {
  const ctx = await requireUser(req);
  if (isResponse(ctx)) return ctx;

  const { data, error } = await ctx.supabase
    .from("spaces")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return badRequest(error.message);
  return NextResponse.json({ spaces: data }, { headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  const ctx = await requireUser(req);
  if (isResponse(ctx)) return ctx;

  let body: CreateSpaceInput;
  try {
    body = (await req.json()) as CreateSpaceInput;
  } catch {
    return badRequest("invalid json");
  }
  const name = body.name?.trim();
  if (!name) return badRequest("name is required");

  const { data, error } = await ctx.supabase
    .from("spaces")
    .insert({ owner_id: ctx.user.id, name })
    .select("*")
    .single();

  if (error) return badRequest(error.message);
  // on_space_created has already added the owner as a member.
  return NextResponse.json({ space: data }, { status: 201, headers: CORS_HEADERS });
}
