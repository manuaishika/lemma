import { setSession } from "./lib/auth.js";
import type { PendingCapture, SelectionCapture } from "./types.js";
import type { RegionMessage } from "./region.js";

const MENU_SELECTION = "lemma-save";
const MENU_SCREENSHOT = "lemma-save-screenshot";
const MENU_LINK = "lemma-save-link";
const MENU_PAGE = "lemma-save-page";
const PENDING_KEY = "lemma_pending_capture";

function createMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_SELECTION,
      title: 'Save "%s" to Lemma',
      contexts: ["selection"],
    });
    chrome.contextMenus.create({
      id: MENU_SCREENSHOT,
      title: "Save screenshot to Lemma (select area)",
      contexts: ["page"],
    });
    chrome.contextMenus.create({
      id: MENU_PAGE,
      title: "Save this page to Lemma",
      contexts: ["page"],
    });
    chrome.contextMenus.create({
      id: MENU_LINK,
      title: "Save this link to Lemma",
      contexts: ["link"],
    });
  });
}

chrome.runtime.onInstalled.addListener(createMenus);
chrome.runtime.onStartup.addListener(createMenus);
createMenus();

async function captureSelectionFromTab(tabId: number): Promise<SelectionCapture | null> {
  try {
    return await chrome.tabs.sendMessage(tabId, { action: "getCapture" });
  } catch {
    return null;
  }
}

async function openPopupWithCapture(capture: PendingCapture) {
  await chrome.storage.local.set({ [PENDING_KEY]: capture });
  await chrome.windows.create({
    url: chrome.runtime.getURL("popup.html"),
    type: "popup",
    width: 380,
    height: 560,
  });
}

async function openPopupWithSelection(tab: chrome.tabs.Tab | undefined, fallbackText: string) {
  let capture: SelectionCapture | null = null;
  if (tab?.id) capture = await captureSelectionFromTab(tab.id);
  if (!capture && fallbackText) {
    capture = {
      kind: "selection",
      text: fallbackText,
      sentence: "",
      pageTitle: tab?.title ?? "",
      url: tab?.url ?? "",
    };
  }
  if (capture) await openPopupWithCapture(capture);
}

async function openPopupWithScreenshot(tab: chrome.tabs.Tab | undefined) {
  if (!tab?.windowId) return;
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
    await openPopupWithCapture({
      kind: "screenshot",
      dataUrl,
      pageTitle: tab.title ?? "",
      url: tab.url ?? "",
    });
  } catch (err) {
    console.error("screenshot capture failed:", err);
  }
}

/** Ask the page for a drag-to-select overlay; fall back to the whole visible tab (e.g. chrome:// pages). */
async function startScreenshot(tab: chrome.tabs.Tab | undefined) {
  if (tab?.id) {
    try {
      const res = await chrome.tabs.sendMessage(tab.id, { action: "startRegionSelect" });
      if (res?.ok) return;
    } catch {
      // no content script on this page — fall through
    }
  }
  await openPopupWithScreenshot(tab);
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return `data:${blob.type};base64,${btoa(binary)}`;
}

/** Crop the visible tab to the region the user dragged, at native (retina) resolution. */
async function openPopupWithRegion(msg: RegionMessage, tab: chrome.tabs.Tab | undefined) {
  if (!tab?.windowId) return;
  try {
    const full = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
    const bitmap = await createImageBitmap(await (await fetch(full)).blob());
    const scale = bitmap.width / msg.viewportWidth;
    const sx = Math.round(msg.rect.x * scale);
    const sy = Math.round(msg.rect.y * scale);
    const sw = Math.max(1, Math.min(Math.round(msg.rect.w * scale), bitmap.width - sx));
    const sh = Math.max(1, Math.min(Math.round(msg.rect.h * scale), bitmap.height - sy));

    const canvas = new OffscreenCanvas(sw, sh);
    canvas.getContext("2d")!.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh);
    const dataUrl = await blobToDataUrl(await canvas.convertToBlob({ type: "image/png" }));

    await openPopupWithCapture({
      kind: "screenshot",
      dataUrl,
      pageTitle: tab.title ?? "",
      url: tab.url ?? "",
    });
  } catch (err) {
    console.error("region capture failed:", err);
  }
}

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.action === "regionSelected") {
    void openPopupWithRegion(message as RegionMessage, sender.tab);
  }
});

async function openPopupWithLink(linkUrl: string, tab: chrome.tabs.Tab | undefined, isPage = false) {
  await openPopupWithCapture({
    kind: "link",
    isPage,
    linkUrl,
    pageTitle: tab?.title ?? "",
    url: tab?.url ?? "",
  });
}

chrome.commands.onCommand.addListener((command) => {
  if (command !== "save-word") return;
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    void openPopupWithSelection(tab, "");
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_SELECTION && info.selectionText) {
    void openPopupWithSelection(tab, info.selectionText.trim());
  } else if (info.menuItemId === MENU_SCREENSHOT) {
    void startScreenshot(tab);
  } else if (info.menuItemId === MENU_PAGE && tab?.url) {
    void openPopupWithLink(tab.url, tab, true);
  } else if (info.menuItemId === MENU_LINK && info.linkUrl) {
    void openPopupWithLink(info.linkUrl, tab);
  }
});

// Session handoff from the web app's /extension/connect page.
chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  if (message?.type === "lemma-auth" && message.access_token && message.refresh_token) {
    void setSession({
      access_token: message.access_token,
      refresh_token: message.refresh_token,
      expires_at: message.expires_at,
      email: message.email,
    }).then(() => sendResponse({ ok: true }));
    return true;
  }
  sendResponse({ ok: false });
  return false;
});
