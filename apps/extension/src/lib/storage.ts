import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config.js";
import { decodeUserId, getAccessToken } from "./auth.js";
import { AuthError } from "./api.js";

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Uploads a screenshot to the private `captures` bucket at
 * "{uid}/{uuid}.png" — the one path shape the storage RLS policy allows the
 * owner to write. Returns the object path to save on the capture row.
 */
export async function uploadScreenshot(dataUrl: string): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase storage isn't configured for this build.");
  }
  const token = await getAccessToken();
  if (!token) throw new AuthError("not connected");
  const userId = decodeUserId(token);
  if (!userId) throw new AuthError("could not resolve account");

  const id = crypto.randomUUID();
  const path = `${userId}/${id}.png`;
  const bytes = dataUrlToBytes(dataUrl);

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/captures/${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
      "content-type": "image/png",
      "x-upsert": "false",
    },
    // bytes.buffer is a fresh ArrayBuffer we just allocated, never Shared —
    // the cast just satisfies TS's stricter BufferSource generics.
    body: bytes.buffer as ArrayBuffer,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`upload failed (${res.status}): ${body.slice(0, 200)}`);
  }
  return path;
}
