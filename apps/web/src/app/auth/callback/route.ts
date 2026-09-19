import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth / email-link landing point. Supabase redirects here with `?code=`;
 * exchange it for a session cookie *before* anything gates /app, then forward.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Only allow same-site relative redirects.
  const rawNext = searchParams.get("next") ?? "/app";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  const providerError = searchParams.get("error_description") ?? searchParams.get("error");
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(providerError ?? "Sign-in link was invalid or expired.")}`,
  );
}
