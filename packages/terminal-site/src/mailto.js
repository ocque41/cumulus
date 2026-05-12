import { spawn } from "node:child_process";
import process from "node:process";

import { CONTACT_EMAIL } from "./content.js";

export function buildMailtoUrl(message, options = {}) {
  const subject = options.subject ?? "Cumulus terminal contact";
  const lines = [
    String(message || "").trim(),
    "",
    "--",
    "Sent from the Cumulus terminal site.",
  ];

  const params = new URLSearchParams({
    subject,
    body: lines.join("\n"),
  });

  return `mailto:${CONTACT_EMAIL}?${params.toString()}`;
}

export function openMailDraft(message, options = {}) {
  const url = buildMailtoUrl(message, options);
  if (options.dryRun || process.env.CUMULUS_TUI_DRY_RUN === "1") {
    return { ok: true, command: "dry-run", url };
  }

  const platform = options.platform ?? process.platform;
  const opener = platform === "darwin" ? "open" : platform === "win32" ? "cmd" : "xdg-open";
  const args =
    platform === "win32"
      ? ["/c", "start", "", url]
      : [url];

  const child = spawn(opener, args, {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });

  child.unref();
  return { ok: true, command: opener, url };
}
