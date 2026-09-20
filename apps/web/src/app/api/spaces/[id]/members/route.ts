import { NextResponse } from "next/server";
import type { InviteMemberInput } from "@lemma/shared";
import { CORS_HEADERS, badRequest, corsPreflight, isResponse, requireUser } from "@/lib/api";
import { sendInviteEmail } from "@/lib/email";

export const runtime = "nodejs";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireUser(req);
  if (isResponse(ctx)) return ctx;
  const { id } = await params;

  const { data, error } = await ctx.supabase
    .from("space_members")
    .select("*, profile:profiles(email, display_name)")
    .eq("space_id", id);

  if (error) return badRequest(error.message);
  return NextResponse.json({ members: data }, { headers: CORS_HEADERS });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireUser(req);
  if (isResponse(ctx)) return ctx;
  const { id } = await params;

  let body: InviteMemberInput;
  try {
    body = (await req.json()) as InviteMemberInput;
  } catch {
    return badRequest("invalid json");
  }
  const email = body.email?.trim();
  if (!email) return badRequest("email is required");

  const { data: userId, error: lookupErr } = await ctx.supabase.rpc("lookup_user_by_email", {
    p_email: email,
  });
  if (lookupErr) return badRequest(lookupErr.message);
  if (!userId) {
    // No account yet: park a pending invite; handle_new_user() claims it on signup.
    const { data: space } = await ctx.supabase.from("spaces").select("name").eq("id", id).single();
    const { data: invite, error: inviteErr } = await ctx.supabase
      .from("space_invites")
      .upsert(
        { space_id: id, email: email.toLowerCase(), invited_by: ctx.user.id },
        { onConflict: "space_id,email" },
      )
      .select("*")
      .single();
    if (inviteErr) return badRequest(inviteErr.message);

    const { data: me } = await ctx.supabase
      .from("profiles")
      .select("display_name")
      .eq("id", ctx.user.id)
      .single();
    const inviter = me?.display_name || ctx.user.email || "A friend";
    const emailed = await sendInviteEmail(email, space?.name ?? "a space", inviter);
    return NextResponse.json({ invite, pending: true, emailed }, { status: 201, headers: CORS_HEADERS });
  }

  // RLS on space_members requires the caller to own this space.
  const { data, error } = await ctx.supabase
    .from("space_members")
    .insert({ space_id: id, user_id: userId, role: "member" })
    .select("*")
    .single();

  if (error) return badRequest(error.message);
  return NextResponse.json({ member: data }, { status: 201, headers: CORS_HEADERS });
}
