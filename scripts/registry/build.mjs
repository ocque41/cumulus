import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..", "..");
const registryPath = path.join(rootDir, "registry.json");
const outputDir = path.join(rootDir, "public", "r");

async function loadRegistry() {
  const content = await fs.readFile(registryPath, "utf8");
  const parsed = JSON.parse(content);

  if (!Array.isArray(parsed.components)) {
    throw new Error("registry.json is missing a components array");
  }

  return parsed.components;
}

async function build() {
  const components = await loadRegistry();

  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });

  const payloads = [];

  for (const component of components) {
    const sourcePath = path.join(rootDir, component.source);
    const source = await fs.readFile(sourcePath, "utf8");
    const type = component.type ?? "registry:ui";

    const payload = {
      name: component.name,
      title: component.title,
      description: component.description,
      type,
      registryDependencies: component.registryDependencies ?? [],
      dependencies: component.dependencies ?? [],
      files: [
        {
          path: component.destination,
          type,
          content: source,
        },
      ],
    };

    const targetPath = path.join(outputDir, `${component.name}.json`);
    await fs.writeFile(targetPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    payloads.push(payload);
  }

  const indexPath = path.join(outputDir, "index.json");
  await fs.writeFile(indexPath, `${JSON.stringify(payloads, null, 2)}\n`, "utf8");

  console.log(`registry: wrote ${payloads.length} components to ${path.relative(rootDir, outputDir)}`);
}

build().catch((error) => {
  console.error("registry: failed to build component outputs");
  console.error(error);
  process.exit(1);
});
