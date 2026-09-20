"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type State =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "no-extension" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage: (
          id: string,
          message: unknown,
          callback?: (response: unknown) => void,
        ) => void;
        lastError?: { message?: string };
      };
    };
  }
}

function Connect() {
  const params = useSearchParams();
  const extId = params.get("ext");
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        setState({ kind: "signed-out" });
        return;
      }
      const chrome = window.chrome;
      if (!extId || !chrome?.runtime?.sendMessage) {
        setState({ kind: "no-extension" });
        return;
      }
      chrome.runtime.sendMessage(
        extId,
        {
          type: "lemma-auth",
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          email: session.user.email,
        },
        () => {
          const err = chrome.runtime?.lastError;
          if (err) {
            setState({ kind: "error", message: err.message ?? "Could not reach the extension." });
          } else {
            setState({ kind: "sent", email: session.user.email ?? "" });
          }
        },
      );
    })();
  }, [extId]);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <p className="font-serif text-sm italic text-ink-faint">Lemma</p>
      <h1 className="mt-3 font-serif text-2xl text-ink">Connect the extension</h1>

      <div className="mt-6 text-sm text-ink-soft">
        {state.kind === "loading" && <p>Checking your session…</p>}
        {state.kind === "signed-out" && (
          <p>
            You need to{" "}
            <Link
              href={`/login?next=${encodeURIComponent(`/extension/connect?ext=${extId ?? ""}`)}`}
              className="text-accent underline underline-offset-4"
            >
              sign in
            </Link>{" "}
            first, then come back to this page.
          </p>
        )}
        {state.kind === "no-extension" && (
          <p>
            Open this page from the Lemma extension&rsquo;s &ldquo;Connect account&rdquo; button so it
            can receive your session.
          </p>
        )}
        {state.kind === "sent" && (
          <p className="text-ink">
            Connected as <span className="font-medium">{state.email}</span>. You can close this tab
            and start saving words.
          </p>
        )}
        {state.kind === "error" && <p className="text-red">{state.message}</p>}
      </div>
    </main>
  );
}

export default function ConnectPage() {
  return (
    <Suspense>
      <Connect />
    </Suspense>
  );
}
