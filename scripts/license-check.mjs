import { execFileSync } from "node:child_process";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const FONT_ENV = "ALCYONE_MEDIUM_WOFF2_BASE64";
const approvedPublicFontPaths = new Set([
  "src/assets/fonts/Jacquard12-Regular.woff2",
  "src/assets/fonts/Jacquard24-Regular.woff2",
  "src/assets/fonts/JacquardaBastarda9-Regular.woff2",
]);
const protectedAssetHashes = new Set([
  "2d04b6c30b3969d0917b9974eea7641390e71ecc70b7247e0004e4ceb11dd6d7",
  "9f817147759c1962369017a8fda7f8a86467bf1ff713b1317968bef5d2e4d2db",
  "a98832238b0751fc7938ca210aeb8f4357691fb3cdb9a8d0f47c233977be45d0",
  "8b672ce01be5180fe0ef7ab3fd987496e4f6e81b13ef49f2577e468064954670",
  "db7a04bb04af24d37185848632c8eea5692bb3ebf0b7aa8cc5d23719e1facf5a",
  "ecde0685e8daf78b5bc8e2002f06a85e24d001afbc697fb1c29a6c824ca69e26",
  "39438b6880ca583e847e42c5fcdd906449f783f2fb78ca9638f9ddd4db077d3b",
]);
const fontExtension = /\.(?:woff2?|ttf|otf|eot)$/i;
const protectedContainerExtension = /\.(?:pdf|zip|7z|rar|tar|tgz|gz)$/i;

const required = [
  ["LICENSE", "Apache License"],
  ["NOTICE", "Cumulus"],
  ["licenses/fonts/Jacquard/OFL.txt", "SIL OPEN FONT LICENSE"],
  ["licenses/fonts/JacquardaBastarda/OFL.txt", "SIL OPEN FONT LICENSE"],
  ["licenses/components/Cult-UI-MIT.txt", "MIT License"],
  ["licenses/components/dither-plugin-MIT.txt", "MIT License"],
  ["public/licenses/animejs-MIT.txt", "Copyright (c) 2025 Julian Garnier"],
  ["licenses/paper-shaders/LICENSE", "Apache License"],
  ["licenses/paper-shaders/NOTICE", "Paper Shaders"],
  ["docs/licensing.md", "ALCYONE_MEDIUM_WOFF2_BASE64"],
];

const problems = [];

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function listFiles(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isSymbolicLink()) return [];
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

function publicPaths() {
  const trackedAndUnignored = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    { encoding: "utf8" },
  )
    .split("\n")
    .filter(Boolean)
    .filter((path) => !path.startsWith("node_modules/") && !path.startsWith("dist/"));

  return [...new Set([...trackedAndUnignored, ...listFiles("dist")])];
}

function findConfiguredFontValues(text) {
  const values = [];
  const environmentAssignment = new RegExp(
    `(?:^|\\n)\\s*(?:export\\s+)?${FONT_ENV}\\s*=([^\\r\\n#]*)`,
    "g",
  );
  const doubleQuotedProperty = new RegExp(`"${FONT_ENV}"\\s*:\\s*"([^"]*)"`, "g");
  const singleQuotedProperty = new RegExp(`'${FONT_ENV}'\\s*:\\s*'([^']*)'`, "g");

  for (const pattern of [environmentAssignment, doubleQuotedProperty, singleQuotedProperty]) {
    for (const match of text.matchAll(pattern)) values.push(match[1].trim());
  }
  return values;
}

function containsProtectedBase64(text) {
  for (const match of text.matchAll(/[A-Za-z0-9+/]{1000,}={0,2}/g)) {
    const encoded = match[0];
    if (encoded.length % 4 !== 0) continue;
    const decoded = Buffer.from(encoded, "base64");
    if (decoded.toString("base64") !== encoded) continue;
    if (protectedAssetHashes.has(digest(decoded))) return true;
  }
  return false;
}

for (const [path, marker] of required) {
  try {
    const contents = readFileSync(path, "utf8");
    if (!contents.includes(marker)) problems.push(`${path}: missing ${marker}`);
  } catch {
    problems.push(`${path}: missing`);
  }
}

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
if (packageJson.license !== "Apache-2.0") {
  problems.push("package.json: license must be Apache-2.0");
}

const approvedPublicFontHashes = new Set(
  [...approvedPublicFontPaths]
    .filter((path) => existsSync(path))
    .map((path) => digest(readFileSync(path))),
);

for (const path of publicPaths()) {
  if (!existsSync(path) || !lstatSync(path).isFile()) continue;
  const value = readFileSync(path);
  const hash = digest(value);
  const lowerPath = path.toLowerCase();

  if (protectedAssetHashes.has(hash)) {
    problems.push(`${path}: protected commercial font package material must remain outside Git and dist`);
    continue;
  }

  if (fontExtension.test(path)) {
    const isApprovedSource = approvedPublicFontPaths.has(path);
    const isApprovedBuiltCopy = path.startsWith("dist/") && approvedPublicFontHashes.has(hash);
    if (!isApprovedSource && !isApprovedBuiltCopy) {
      problems.push(`${path}: unapproved font binary must remain outside the public distribution`);
    }
  }

  if (
    protectedContainerExtension.test(path) &&
    (lowerPath.includes("alcyone") || value.toString("latin1").toLowerCase().includes("alcyone"))
  ) {
    problems.push(`${path}: protected commercial font archive or license PDF must remain private`);
  }

  if (value.includes(0)) continue;
  const text = value.toString("utf8");
  if (findConfiguredFontValues(text).some((configured) => configured.length > 0)) {
    problems.push(`${path}: ${FONT_ENV} must be empty in public files and browser output`);
  }
  if (containsProtectedBase64(text)) {
    problems.push(`${path}: encoded protected commercial font package material is public`);
  }
}

if (problems.length > 0) {
  console.error("License check failed:");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log("LICENSE_BOUNDARY_OK root=Apache-2.0 public_fonts=OFL-1.1 private_webfont=external components=MIT animation=MIT paper=Apache-2.0");
