import { NextResponse } from "next/server";
import { classifyCaptureType, normalizeSelection, type CreateCaptureInput } from "@lemma/shared";
import { CORS_HEADERS, badRequest, corsPreflight, isResponse, requireUser } from "@/lib/api";

export const runtime = "nodejs";

const PAGE_SIZE = 50;

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(req: Request) {
  const ctx = await requireUser(req);
  if (isResponse(ctx)) return ctx;

  const url = new URL(req.url);
  // strip characters that would break the PostgREST .or() filter grammar
  const q = url.searchParams.get("q")?.trim().replace(/[,()\\*]/g, " ").trim();
  const cursor = url.searchParams.get("cursor");
  const space = url.searchParams.get("space"); // omitted = personal vault only

  let query = ctx.supabase
    .from("captures")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  query = space ? query.eq("space_id", space) : query.is("space_id", null);
  if (q) query = query.or(`text.ilike.%${q}%,user_note.ilike.%${q}%,explanation.ilike.%${q}%`);
  if (cursor) query = query.lt("created_at", cursor);

  const { data, error } = await query;
  if (error) return badRequest(error.message);

  const nextCursor = data.length === PAGE_SIZE ? data[data.length - 1]!.created_at : null;
  return NextResponse.json({ captures: data, nextCursor }, { headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  const ctx = await requireUser(req);
  if (isResponse(ctx)) return ctx;

  let body: CreateCaptureInput;
  try {
    body = (await req.json()) as CreateCaptureInput;
  } catch {
    return badRequest("invalid json");
  }

  const text = normalizeSelection(body.text ?? "");
  const capture_type = body.capture_type ?? (text ? classifyCaptureType(text) : "note");

  if (!text && capture_type !== "screenshot") return badRequest("text is required");
  if (capture_type === "screenshot" && !body.image_path) return badRequest("image_path is required");
  if (capture_type === "link" && !body.link_url) return badRequest("link_url is required");

  const { data, error } = await ctx.supabase
    .from("captures")
    .insert({
      user_id: ctx.user.id,
      text,
      capture_type,
      sentence: body.sentence ?? null,
      page_title: body.page_title ?? null,
      source_url: body.source_url ?? null,
      link_url: body.link_url ?? null,
      image_path: body.image_path ?? null,
      explanation: body.explanation ?? null,
      dictionary_definition: body.dictionary_definition ?? null,
      user_note: body.user_note ?? null,
      space_id: body.space_id ?? null,
    })
    .select("*")
    .single();

  if (error) return badRequest(error.message);
  // The on_capture_created trigger has already created the SRS card.
  return NextResponse.json({ capture: data }, { status: 201, headers: CORS_HEADERS });
}
