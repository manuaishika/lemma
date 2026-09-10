export interface SelectionCapture {
  kind: "selection";
  text: string;
  sentence: string;
  pageTitle: string;
  url: string;
}

export interface ScreenshotCapture {
  kind: "screenshot";
  /** data:image/png;base64,... straight from chrome.tabs.captureVisibleTab */
  dataUrl: string;
  pageTitle: string;
  url: string;
}

export interface LinkCapture {
  kind: "link";
  linkUrl: string;
  pageTitle: string;
  url: string;
}

export type PendingCapture = SelectionCapture | ScreenshotCapture | LinkCapture;

export type ContentMessage = { action: "getCapture" };
