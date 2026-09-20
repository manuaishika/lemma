import type {
  Space,
  Capture,
  CreateCaptureInput,
  ExplainInput,
  ExplainResult,
} from "@lemma/shared";
import { API_BASE } from "./config.js";
import { clearSession, getAccessToken } from "./auth.js";

export class AuthError extends Error {}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new AuthError("not connected");

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 401) {
    await clearSession();
    throw new AuthError("session expired");
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body.slice(0, 200)}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function explainWord(input: ExplainInput): Promise<ExplainResult> {
  return request<ExplainResult>("/api/explain", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listSpaces(): Promise<{ spaces: Space[] }> {
  return request<{ spaces: Space[] }>("/api/spaces");
}

export function createCapture(input: CreateCaptureInput): Promise<{ capture: Capture }> {
  return request<{ capture: Capture }>("/api/captures", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
