/**
 * Drag-to-select overlay for screenshot captures. The background script
 * asks for it ("startRegionSelect"); on mouse-up we hand the viewport rect
 * back ("regionSelected") and the background crops captureVisibleTab to it.
 */

const MIN_SIZE = 8; // px — smaller than this is treated as a stray click

export interface RegionMessage {
  action: "regionSelected";
  rect: { x: number; y: number; w: number; h: number };
  viewportWidth: number;
  viewportHeight: number;
}

let active = false;

export function startRegionSelect(): void {
  if (active) return;
  active = true;

  const root = document.createElement("div");
  root.style.cssText =
    "all:initial;position:fixed;inset:0;z-index:2147483647;cursor:crosshair;" +
    "background:rgba(20,20,18,.25);user-select:none;-webkit-user-select:none;";

  const box = document.createElement("div");
  box.style.cssText =
    "position:fixed;display:none;border:2px solid #7cb89f;border-radius:2px;" +
    "box-shadow:0 0 0 100vmax rgba(20,20,18,.45);pointer-events:none;";

  const hint = document.createElement("div");
  hint.textContent = "Drag to select what to save  ·  Esc to cancel";
  hint.style.cssText =
    "position:fixed;top:16px;left:50%;transform:translateX(-50%);padding:8px 14px;" +
    "border-radius:999px;background:#1a1a1a;color:#f0eee9;font:500 13px system-ui,sans-serif;" +
    "pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.25);";

  root.append(box, hint);
  document.documentElement.append(root);

  let startX = 0;
  let startY = 0;
  let dragging = false;

  const rectFrom = (x: number, y: number) => ({
    x: Math.min(startX, x),
    y: Math.min(startY, y),
    w: Math.abs(x - startX),
    h: Math.abs(y - startY),
  });

  function cleanup() {
    root.remove();
    window.removeEventListener("keydown", onKey, true);
    active = false;
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      cleanup();
    }
  }

  root.addEventListener("mousedown", (e) => {
    e.preventDefault();
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    hint.style.display = "none";
    root.style.background = "transparent"; // the box's shadow does the dimming now
    Object.assign(box.style, { display: "block", left: `${startX}px`, top: `${startY}px`, width: "0", height: "0" });
  });

  root.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const r = rectFrom(e.clientX, e.clientY);
    Object.assign(box.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
  });

  root.addEventListener("mouseup", (e) => {
    if (!dragging) return;
    dragging = false;
    const rect = rectFrom(e.clientX, e.clientY);
    cleanup();
    if (rect.w < MIN_SIZE || rect.h < MIN_SIZE) return;

    // Let the overlay actually leave the screen before the background captures the tab.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const msg: RegionMessage = {
          action: "regionSelected",
          rect,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
        };
        void chrome.runtime.sendMessage(msg);
      }),
    );
  });

  window.addEventListener("keydown", onKey, true);
}
