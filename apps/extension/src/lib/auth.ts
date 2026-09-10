import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config.js";

const KEY = "lemma_session";

export interface StoredSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number; // unix seconds
  email?: string;
}

export async function getSession(): Promise<StoredSession | null> {
  const raw = await chrome.storage.local.get(KEY);
  return (raw[KEY] as StoredSession) ?? null;
}

export async function setSession(session: StoredSession): Promise<void> {
  await chrome.storage.local.set({ [KEY]: session });
}

export async function clearSession(): Promise<void> {
  await chrome.storage.local.remove(KEY);
}

function expired(session: StoredSession): boolean {
  if (!session.expires_at) return false;
  return Date.now() / 1000 > session.expires_at - 60;
}

/** Decode the `sub` claim (the user id) out of a Supabase access-token JWT, no verification needed client-side. */
export function decodeUserId(accessToken: string): string | null {
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return (JSON.parse(json).sub as string) ?? null;
  } catch {
    return null;
  }
}

/** A valid access token, refreshing against Supabase if the current one is stale. */
export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;
  if (!expired(session)) return session.access_token;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Can't refresh — force a reconnect.
    await clearSession();
    return null;
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    if (!res.ok) {
      await clearSession();
      return null;
    }
    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_at?: number;
    };
    const next: StoredSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      email: session.email,
    };
    await setSession(next);
    return next.access_token;
  } catch {
    await clearSession();
    return null;
  }
}
