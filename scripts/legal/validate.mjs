import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const legalDir = path.resolve(__dirname, "../../src/content/legal");

const legalMetaSchema = z.object({
  company: z.object({
    displayName: z.string(),
    legalName: z.string(),
    country: z.string(),
    address: z.string(),
    contactEmail: z.string().email(),
    dpoEmail: z.string().email(),
    website: z.string().url(),
  }),
  legal: z.object({
    governingLaw: z.string(),
    jurisdiction: z.string(),
    lastUpdated: z.string().regex(/\d{4}-\d{2}-\d{2}/, "Must be ISO date (YYYY-MM-DD)"),
    defaultLanguage: z.enum(["es", "en"]),
    noindexUntilApproved: z.boolean(),
  }),
});

const processorSchema = z.object({
  name: z.string(),
  category: z.string(),
  role: z.string(),
  dataTypes: z.array(z.string()).nonempty(),
  purpose: z.string(),
  docsUrl: z.string().url(),
  privacyUrl: z.string().url(),
});

const catalogItemSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
});

async function readJson(filename) {
  const filePath = path.join(legalDir, filename);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function main() {
  const meta = await readJson("legal-meta.json");
  legalMetaSchema.parse(meta);

  const processors = await readJson("processors.json");
  z.array(processorSchema).parse(processors);

  const products = await readJson("products.json");
  z.array(catalogItemSchema).parse(products);

  const services = await readJson("services.json");
  z.array(catalogItemSchema).parse(services);

  console.log("✔ Legal content JSON validated successfully");
}

main().catch((error) => {
  console.error("✖ Legal content validation failed");
  console.error(error);
  process.exit(1);
});
