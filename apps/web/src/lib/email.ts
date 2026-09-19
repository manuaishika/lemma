import { Resend } from "resend";
import type { Capture } from "@lemma/shared";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.LEMMA_REMINDER_FROM || "Lemma <reminders@lemma.app>";

function captureLabel(capture: Capture): string {
  if (capture.capture_type === "screenshot") return "a screenshot you saved";
  if (capture.capture_type === "link") return capture.text || capture.link_url || "a link you saved";
  return capture.text;
}

/**
 * "Hey, you saved this -- still want to look into it?" Sent once per capture,
 * 3 days after it was saved (see captures.remind_at). Silently no-ops without
 * RESEND_API_KEY, same degrade-gracefully pattern as /api/explain.
 */
export async function sendReminderEmail(to: string, capture: Capture): Promise<boolean> {
  if (!resend) return false;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const link = `${appUrl}/app/capture/${capture.id}`;
  const label = captureLabel(capture);

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Still want to look into "${label}"?`,
    html: `
      <div style="font-family: Georgia, 'Newsreader', serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <p style="font-style: italic; color: #8a8a8a; margin-bottom: 24px;">Lemma</p>
        <p>A few days ago you saved <strong>${escapeHtml(label)}</strong>${
          capture.source_url ? ` from <span style="color: #4a4a4a;">${escapeHtml(new URL(capture.source_url).hostname)}</span>` : ""
        }.</p>
        <p style="color: #4a4a4a;">Still want to look into it?</p>
        <p style="margin-top: 32px;">
          <a href="${link}" style="background: #2d5f4c; color: #fdfcfa; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-family: system-ui, sans-serif;">
            Open in Lemma
          </a>
        </p>
      </div>
    `,
  });

  return !error;
}

/** "X invited you to a Lemma space." Returns false (no throw) when Resend isn't configured. */
export async function sendInviteEmail(to: string, spaceName: string, inviterEmail: string): Promise<boolean> {
  if (!resend) return false;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `${inviterEmail} invited you to "${spaceName}" on Lemma`,
    html: `
      <div style="font-family: Georgia, 'Newsreader', serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <p style="font-style: italic; color: #8a8a8a; margin-bottom: 24px;">Lemma</p>
        <p><strong>${escapeHtml(inviterEmail)}</strong> invited you to a shared space, <strong>${escapeHtml(spaceName)}</strong>.</p>
        <p style="color: #4a4a4a;">Create an account with this email address and it will be waiting for you.</p>
        <p style="margin-top: 32px;">
          <a href="${appUrl}/login?mode=signup" style="background: #2d5f4c; color: #fdfcfa; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-family: system-ui, sans-serif;">
            Create your account
          </a>
        </p>
      </div>
    `,
  });

  return !error;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
