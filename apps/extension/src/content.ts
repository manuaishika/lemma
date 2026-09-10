import { enclosingSentence, normalizeSelection } from "@lemma/shared";
import type { SelectionCapture } from "./types.js";

let lastSelectionText = "";
let lastSelectionSentence = "";

function blockTextForSelection(sel: Selection): string {
  const node = sel.anchorNode;
  const el = node instanceof Element ? node : node?.parentElement;
  const block = el?.closest("p, li, blockquote, td, div, section, article, h1, h2, h3, h4");
  return block?.textContent ?? sel.toString();
}

document.addEventListener("mouseup", () => {
  const sel = window.getSelection();
  const text = normalizeSelection(sel?.toString() ?? "");
  if (text && text.length <= 400) {
    lastSelectionText = text;
    lastSelectionSentence = sel ? enclosingSentence(blockTextForSelection(sel), text) : "";
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action === "getCapture") {
    const sel = window.getSelection();
    const live = normalizeSelection(sel?.toString() ?? "");
    const text = live || lastSelectionText;
    const sentence =
      live && sel ? enclosingSentence(blockTextForSelection(sel), live) : lastSelectionSentence;

    const capture: SelectionCapture = {
      kind: "selection",
      text,
      sentence,
      pageTitle: document.title,
      url: location.href,
    };
    sendResponse(capture);
  }
  return true;
});
