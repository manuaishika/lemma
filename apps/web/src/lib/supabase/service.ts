import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS. Server-only, and only for the one place
 * that needs it: minting a signed URL for a screenshot after we've already
 * confirmed (via the caller's own RLS-scoped query) that they can see the
 * capture it belongs to. Never expose this client or its key to a request
 * response or a browser bundle.
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
