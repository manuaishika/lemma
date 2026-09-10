import { setSession } from "./lib/auth.js";
import type { PendingCapture, SelectionCapture } from "./types.js";

const MENU_SELECTION = "lemma-save";
const MENU_SCREENSHOT = "lemma-save-screenshot";
const MENU_LINK = "lemma-save-link";
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
      title: "Save screenshot to Lemma",
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

async function openPopupWithLink(linkUrl: string, tab: chrome.tabs.Tab | undefined) {
  await openPopupWithCapture({
    kind: "link",
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
    void openPopupWithScreenshot(tab);
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
