import { readFileSync } from "node:fs";

const required = [
  ["LICENSE", "Apache License"],
  ["NOTICE", "Cumulus"],
  ["licenses/fonts/Jacquard/OFL.txt", "SIL OPEN FONT LICENSE"],
  ["licenses/fonts/JacquardaBastarda/OFL.txt", "SIL OPEN FONT LICENSE"],
  ["licenses/components/Cult-UI-MIT.txt", "MIT License"],
  ["licenses/components/dither-plugin-MIT.txt", "MIT License"],
  ["licenses/paper-shaders/LICENSE", "Apache License"],
  ["licenses/paper-shaders/NOTICE", "Paper Shaders"],
];

const problems = [];

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

if (problems.length > 0) {
  console.error("License check failed:");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log("LICENSE_BOUNDARY_OK root=Apache-2.0 fonts=OFL-1.1 components=MIT paper=Apache-2.0");
