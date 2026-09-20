import { buildDisplayTitle, classifyCaptureType, type CaptureType } from "@lemma/shared";
import { API_BASE } from "../lib/config.js";
import { clearSession, getSession } from "../lib/auth.js";
import { AuthError, createCapture, explainWord } from "../lib/api.js";
import { uploadScreenshot } from "../lib/storage.js";
import type { PendingCapture } from "../types.js";

const PENDING_KEY = "lemma_pending_capture";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const ONBOARDED_KEY = "lemma_onboarded";

const SLIDES = [
  {
    title: "Right-click to save",
    body: "Select a word, then right-click and choose Save to Lemma. Screenshots and links work the same way.",
  },
  {
    title: "Say why it mattered",
    body: "Write one sentence in your own words. Lemma asks for it every time, because it's the part you keep.",
  },
  {
    title: "It comes back",
    body: "Saved things return on a schedule. Rate each Again, Hard, Good or Easy and Lemma decides when you see it next.",
  },
];

const views = {
  onboard: $("onboard-view"),
  connect: $("connect-view"),
  capture: $("capture-view"),
  empty: $("empty-view"),
};
function show(view: keyof typeof views) {
  for (const [k, el] of Object.entries(views)) el.hidden = k !== view;
}

async function getPendingCapture(): Promise<PendingCapture | null> {
  const stored = await chrome.storage.local.get(PENDING_KEY);
  if (!stored[PENDING_KEY]) return null;
  await chrome.storage.local.remove(PENDING_KEY);
  return stored[PENDING_KEY] as PendingCapture;
}

function initOnboarding() {
  show("onboard");
  const dots = $("ob-dots");
  const slide = $("ob-slide");
  const nextBtn = $("ob-next");
  let i = 0;

  dots.replaceChildren(...SLIDES.map(() => document.createElement("i")));

  function render() {
    const s = SLIDES[i]!;
    $("ob-title").textContent = s.title;
    $("ob-body").textContent = s.body;
    dots.querySelectorAll("i").forEach((d, n) => d.classList.toggle("on", n <= i));
    nextBtn.textContent = i === SLIDES.length - 1 ? "Get started" : "Next";
    slide.style.animation = "none";
    void slide.offsetWidth; // restart the entry animation
    slide.style.animation = "";
  }

  async function finish() {
    await chrome.storage.local.set({ [ONBOARDED_KEY]: true });
    void main(); // a capture that opened the popup is still waiting in storage
  }

  nextBtn.addEventListener("click", () => {
    if (i < SLIDES.length - 1) {
      i += 1;
      render();
    } else {
      void finish();
    }
  });
  $("ob-skip").addEventListener("click", () => void finish());
  render();
}

function initConnectView() {
  show("connect");
  $("connect-btn").addEventListener("click", () => {
    chrome.tabs.create({ url: `${API_BASE}/extension/connect?ext=${chrome.runtime.id}` });
    window.close();
  });
}

async function initCaptureView(pending: PendingCapture, email: string) {
  show("capture");

  const wordInput = $<HTMLInputElement>("word");
  const kindEl = $("kind");
  const sentenceEl = $("sentence");
  const linkUrlEl = $("linkUrlDisplay");
  const screenshotEl = $<HTMLImageElement>("screenshotPreview");
  const noteEl = $<HTMLTextAreaElement>("note");
  const explanationEl = $("explanation");
  const dictEl = $<HTMLDetailsElement>("dict");
  const dictTextEl = $("dict-text");
  const saveBtn = $<HTMLButtonElement>("save-btn");
  const statusEl = $("status");

  $("account").textContent = email;
  $("signout-btn").addEventListener("click", async () => {
    await clearSession();
    initConnectView();
  });

  let captureType: CaptureType;
  let explanation: string | null = null;
  let dictionary: string | null = null;

  if (pending.kind === "screenshot") {
    captureType = "screenshot";
    kindEl.textContent = "screenshot";
    screenshotEl.src = pending.dataUrl;
    screenshotEl.hidden = false;
    wordInput.placeholder = "Caption (optional)";
    wordInput.value = "";
    sentenceEl.textContent = "";
    explanationEl.textContent = "";
    noteEl.focus();
  } else if (pending.kind === "link") {
    captureType = "link";
    kindEl.textContent = "link";
    wordInput.placeholder = "Title (optional)";
    wordInput.value = "";
    linkUrlEl.hidden = false;
    linkUrlEl.textContent = pending.linkUrl;
    explanationEl.textContent = "";
    noteEl.focus();
  } else {
    captureType = classifyCaptureType(pending.text);
    kindEl.textContent = captureType === "note" ? "note" : "word";
    wordInput.value = pending.text;
    sentenceEl.textContent = pending.sentence ? `“…${pending.sentence}…”` : "";
    noteEl.focus();

    wordInput.addEventListener("input", () => {
      captureType = classifyCaptureType(wordInput.value);
      kindEl.textContent = captureType === "note" ? "note" : "word";
    });

    explanationEl.textContent = "Looking up how it’s used here…";
    try {
      const result = await explainWord({
        text: pending.text,
        sentence: pending.sentence || null,
        page_title: pending.pageTitle || null,
        source_url: pending.url || null,
      });
      explanation = result.explanation;
      dictionary = result.dictionary_definition;
      explanationEl.textContent = explanation ?? "No explanation available — your note is what counts.";
      if (dictionary) {
        dictTextEl.textContent = dictionary;
        dictEl.hidden = false;
      }
    } catch (err) {
      if (err instanceof AuthError) return initConnectView();
      explanationEl.textContent = "Could not fetch an explanation. Your note is what counts.";
    }
  }

  saveBtn.addEventListener("click", async () => {
    if (captureType === "term" || captureType === "note") {
      if (!wordInput.value.trim()) {
        statusEl.textContent = "Add a word first";
        statusEl.className = "status error";
        return;
      }
    }

    if (!noteEl.value.trim()) {
      statusEl.textContent = "Write why this mattered to you first";
      statusEl.className = "status error";
      noteEl.focus();
      return;
    }

    saveBtn.disabled = true;
    statusEl.className = "status";
    statusEl.textContent = captureType === "screenshot" ? "Uploading…" : "Saving…";

    try {
      let image_path: string | null = null;
      if (pending.kind === "screenshot") {
        image_path = await uploadScreenshot(pending.dataUrl);
      }

      statusEl.textContent = "Saving…";
      const text = wordInput.value.trim();

      await createCapture({
        text,
        capture_type: captureType,
        sentence: pending.kind === "selection" ? pending.sentence || null : null,
        page_title: pending.pageTitle || null,
        source_url: pending.url || null,
        link_url: pending.kind === "link" ? pending.linkUrl : null,
        image_path,
        explanation,
        dictionary_definition: dictionary,
        user_note: noteEl.value.trim(),
      });

      statusEl.textContent = `Saved “${text ? buildDisplayTitle(text, captureType === "note" ? "note" : "term") : captureType}”`;
      setTimeout(() => window.close(), 700);
    } catch (err) {
      saveBtn.disabled = false;
      if (err instanceof AuthError) return initConnectView();
      statusEl.className = "status error";
      statusEl.textContent = "Could not save";
    }
  });
}

async function main() {
  const seen = await chrome.storage.local.get(ONBOARDED_KEY);
  if (!seen[ONBOARDED_KEY]) return initOnboarding();

  const session = await getSession();
  if (!session) return initConnectView();

  const pending = await getPendingCapture();
  if (!pending || (pending.kind === "selection" && !pending.text)) {
    show("empty");
    return;
  }
  await initCaptureView(pending, session.email ?? "");
}

void main();
