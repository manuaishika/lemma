// Shared domain + API types for Lemma. Imported by @lemma/web and @lemma/extension.

export type CaptureType = "term" | "note" | "screenshot" | "link";

/**
 * Review grades, lowest-to-highest recall quality.
 * 0 Again — failed, 1 Hard, 2 Good, 3 Easy.
 */
export type Grade = 0 | 1 | 2 | 3;

export const GRADES: readonly Grade[] = [0, 1, 2, 3] as const;

export const GRADE_LABELS: Record<Grade, string> = {
  0: "Again",
  1: "Hard",
  2: "Good",
  3: "Easy",
};

export interface Capture {
  id: string;
  user_id: string;
  /** The word/phrase (term|note), the link's title (link), or empty (screenshot). */
  text: string;
  capture_type: CaptureType;
  sentence: string | null;
  page_title: string | null;
  /** The page you were on when you captured this. */
  source_url: string | null;
  /** The saved URL itself — capture_type "link" only. */
  link_url: string | null;
  /** Storage object path — capture_type "screenshot" only. Fetch the image via GET /api/captures/:id/image. */
  image_path: string | null;
  /** Context-aware explanation from Claude. Recessive scaffolding, not the artifact. */
  explanation: string | null;
  /** Generic dictionary gloss, kept as a fallback reference. */
  dictionary_definition: string | null;
  /** The user's own understanding. This is the artifact. */
  user_note: string | null;
  /** null = personal vault; set = lives in a shared space. */
  space_id: string | null;
  /** When the "still want to look into this?" reminder email goes out. */
  remind_at: string;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface Space {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

export interface SpaceMember {
  space_id: string;
  user_id: string;
  role: "owner" | "member";
  created_at: string;
}

export interface SrsCard {
  id: string;
  capture_id: string;
  user_id: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  due_at: string;
  last_reviewed_at: string | null;
}

export interface ReviewLog {
  id: string;
  card_id: string;
  user_id: string;
  grade: Grade;
  prev_interval: number;
  new_interval: number;
  prev_ease: number;
  new_ease: number;
  reviewed_at: string;
}

/** A due card joined with its capture, as returned by GET /api/review/due. */
export interface DueCard {
  card: SrsCard;
  capture: Capture;
}

// --- API payloads ---------------------------------------------------------

export interface CreateCaptureInput {
  text: string;
  capture_type: CaptureType;
  sentence?: string | null;
  page_title?: string | null;
  source_url?: string | null;
  link_url?: string | null;
  image_path?: string | null;
  explanation?: string | null;
  dictionary_definition?: string | null;
  user_note?: string | null;
  space_id?: string | null;
}

export interface UpdateCaptureInput {
  user_note?: string | null;
  capture_type?: CaptureType;
  explanation?: string | null;
  dictionary_definition?: string | null;
}

export interface CreateSpaceInput {
  name: string;
}

export interface InviteMemberInput {
  email: string;
}

export interface ExplainInput {
  text: string;
  sentence?: string | null;
  page_title?: string | null;
  source_url?: string | null;
}

export interface ExplainResult {
  explanation: string | null;
  dictionary_definition: string | null;
}

export interface ReviewInput {
  card_id: string;
  grade: Grade;
}

/** text -> minimal record, for the re-encounter lookup (built out in a later pass). */
export type VaultLookup = Record<string, { id: string; user_note: string | null }>;
