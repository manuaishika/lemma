// Builds the extension against a production API base and zips dist/ for
// Chrome Web Store upload. Usage:
//   LEMMA_API_BASE=https://your-domain.com node scripts/package.mjs
import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const dist = resolve(root, "dist");

const apiBase = process.env.LEMMA_API_BASE;
if (!apiBase || apiBase.includes("localhost")) {
  console.error(
    "Refusing to package a store build with LEMMA_API_BASE unset or pointing at localhost.\n" +
      "Set it to your deployed web app's origin, e.g.:\n" +
      "  LEMMA_API_BASE=https://lemma.yourdomain.com node scripts/package.mjs",
  );
  process.exit(1);
}

const pkg = JSON.parse(await import("node:fs").then((fs) => fs.readFileSync(resolve(root, "package.json"), "utf8")));
const zipPath = resolve(root, `lemma-extension-v${pkg.version}.zip`);

console.log(`[package] building against ${apiBase} ...`);
execFileSync("node", ["build.mjs"], { cwd: root, stdio: "inherit", env: process.env });

if (existsSync(zipPath)) rmSync(zipPath);

console.log(`[package] zipping dist/ -> ${zipPath}`);
if (process.platform === "win32") {
  execFileSync(
    "powershell.exe",
    ["-NoProfile", "-Command", `Compress-Archive -Path '${dist}\\*' -DestinationPath '${zipPath}' -Force`],
    { stdio: "inherit" },
  );
} else {
  execFileSync("zip", ["-r", zipPath, "."], { cwd: dist, stdio: "inherit" });
}

console.log(`[package] done: ${zipPath}`);
console.log("[package] upload this file at chrome.google.com/webstore/devconsole");
