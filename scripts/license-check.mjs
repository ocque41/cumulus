import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const approvedPublicFontPaths = new Set([
  "src/assets/fonts/GFSNeohellenic-Bold.ttf",
  "src/assets/fonts/GFSNeohellenic-BoldItalic.ttf",
  "src/assets/fonts/GFSNeohellenic-Italic.ttf",
  "src/assets/fonts/GFSNeohellenic-Regular.ttf",
  "src/assets/fonts/Jacquard12-Regular.woff2",
  "src/assets/fonts/Jacquard24-Regular.woff2",
  "src/assets/fonts/JacquardaBastarda9-Regular.woff2",
]);
const fontExtension = /\.(?:woff2?|ttf|otf|eot)$/i;

const required = [
  ["LICENSE", "Apache License"],
  ["NOTICE", "Cumulus"],
  ["licenses/fonts/Jacquard/OFL.txt", "SIL OPEN FONT LICENSE"],
  ["licenses/fonts/JacquardaBastarda/OFL.txt", "SIL OPEN FONT LICENSE"],
  ["licenses/fonts/GFSNeohellenic/OFL.txt", "Greek Font Society"],
  ["licenses/components/Cult-UI-MIT.txt", "MIT License"],
  ["licenses/components/dither-plugin-MIT.txt", "MIT License"],
  ["public/licenses/animejs-MIT.txt", "Copyright (c) 2025 Julian Garnier"],
  ["licenses/paper-shaders/LICENSE", "Apache License"],
  ["licenses/paper-shaders/NOTICE", "Paper Shaders"],
  ["docs/licensing.md", "GFS Neohellenic"],
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
  if (fontExtension.test(path)) {
    const isApprovedSource = approvedPublicFontPaths.has(path);
    const isApprovedBuiltCopy = path.startsWith("dist/") && approvedPublicFontHashes.has(hash);
    if (!isApprovedSource && !isApprovedBuiltCopy) {
      problems.push(`${path}: unapproved font binary must remain outside the public distribution`);
    }
  }

  if (value.includes(0)) continue;
}

if (problems.length > 0) {
  console.error("License check failed:");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log("LICENSE_BOUNDARY_OK root=Apache-2.0 public_fonts=OFL-1.1 components=MIT animation=MIT paper=Apache-2.0");
