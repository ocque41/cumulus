import { execFileSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  readFileSync,
  readlinkSync,
  readdirSync,
} from "node:fs";
import { isAbsolute, join } from "node:path";

const trackedAndPublic = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard"],
  { encoding: "utf8" },
)
  .split("\n")
  .filter(Boolean)
  .filter((path) => !path.startsWith("node_modules/") && !path.startsWith("dist/"));

const secretPatterns = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["Supabase service key", /SUPABASE_SERVICE_ROLE_KEY\s*=\s*(?!replace-with-)[^\s#]+/],
  ["Resend API key", /\bre_[A-Za-z0-9_-]{20,}\b/],
  ["Vercel token", /\bvercel_[A-Za-z0-9_-]{20,}\b/],
  [
    "GitHub access token",
    /\b(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,})\b/,
  ],
  [
    "generic secret assignment",
    /^(?:export\s+)?[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD)[A-Z0-9_]*\s*=\s*(?!replace-with-|<|$)[^\s#'"]{16,}/m,
  ],
];

const privatePathPatterns = [
  /(^|\/)\.env($|\.)/,
  /(^|\/)\.vercel\//,
  /(^|\/)(?:dump|backup|subscribers?)(?:\.|\/)/i,
  /(^|\/)(?:logs?|runtime-data)\//i,
];

const browserBundlePatterns = [
  [
    "server-only environment identifier",
    /\b(?:SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY|GITHUB_ACCESS_TOKEN|NOTIFICATION_FROM_EMAIL|NOTIFICATION_POSTAL_ADDRESS|NOTIFICATION_PUBLISH_SECRET|NOTIFICATION_UNSUBSCRIBE_SECRET)\b/,
  ],
  ["local absolute path", /(?:\/Users\/|\/private\/tmp\/|[A-Za-z]:\\Users\\)/],
];

function listFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

const builtBrowserAssets = existsSync("dist")
  ? listFiles("dist").filter((path) => /\.(?:css|html|js|json|map)$/i.test(path))
  : [];

const findings = [];

for (const path of trackedAndPublic) {
  if (lstatSync(path).isSymbolicLink()) {
    const target = readlinkSync(path);
    if (isAbsolute(target) || target.split(/[\\/]/).includes("..")) {
      findings.push(`${path}: symlink escapes the public repository.`);
    }
    continue;
  }

  const isPublicEnvironmentTemplate = path === ".env.example";

  if (
    !isPublicEnvironmentTemplate &&
    privatePathPatterns.some((pattern) => pattern.test(path))
  ) {
    findings.push(`${path}: private-looking path is public.`);
    continue;
  }

  if (path === "package-lock.json" || path.endsWith(".woff2")) continue;

  const value = readFileSync(path);
  if (value.includes(0)) continue;
  const text = value.toString("utf8");

  if (/(?:\/Users\/|\/private\/tmp\/|[A-Za-z]:\\Users\\)/.test(text)) {
    findings.push(`${path}: possible local absolute path.`);
  }

  for (const [label, pattern] of secretPatterns) {
    if (pattern.test(text)) findings.push(`${path}: possible ${label}.`);
  }
}

for (const path of builtBrowserAssets) {
  const value = readFileSync(path);
  if (value.includes(0)) continue;
  const text = value.toString("utf8");

  for (const [label, pattern] of [...secretPatterns, ...browserBundlePatterns]) {
    if (pattern.test(text)) findings.push(`${path}: possible ${label}.`);
  }
}

if (findings.length > 0) {
  console.error("Public safety scan failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(
  `PUBLIC_SAFETY_OK files=${trackedAndPublic.length} browser_assets=${builtBrowserAssets.length}`,
);
