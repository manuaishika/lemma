import { NextResponse } from "next/server";
import { CORS_HEADERS, corsPreflight, isResponse, requireUser } from "@/lib/api";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsPreflight();
}

/**
 * Signed-URL proxy for a screenshot capture's image. The bucket itself only
 * grants direct access to its owner; this route is what lets a space member
 * view someone else's screenshot — visibility is decided by the normal
 * RLS-scoped `select` below, not by the storage policy.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireUser(req);
  if (isResponse(ctx)) return ctx;
  const { id } = await params;

  const { data: capture, error } = await ctx.supabase
    .from("captures")
    .select("image_path")
    .eq("id", id)
    .single();

  if (error || !capture?.image_path) {
    return NextResponse.json({ error: "not found" }, { status: 404, headers: CORS_HEADERS });
  }

  const service = createServiceClient();
  const { data: signed, error: signErr } = await service.storage
    .from("captures")
    .createSignedUrl(capture.image_path, 60);

  if (signErr || !signed) {
    return NextResponse.json({ error: "could not sign url" }, { status: 500, headers: CORS_HEADERS });
  }

  return NextResponse.json({ url: signed.signedUrl }, { headers: CORS_HEADERS });
}
