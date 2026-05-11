import legalMetaRaw from "@/content/legal/legal-meta.json" assert { type: "json" };
import processorsRaw from "@/content/legal/processors.json" assert { type: "json" };
import productsRaw from "@/content/legal/products.json" assert { type: "json" };
import servicesRaw from "@/content/legal/services.json" assert { type: "json" };

import {
  catalogSchema,
  legalMetaSchema,
  processorsSchema,
  type CatalogItem,
  type LegalMeta,
  type Processor,
} from "./schema";

export const legalMeta: LegalMeta = legalMetaSchema.parse(legalMetaRaw);

export const processors: Processor[] = processorsSchema.parse(processorsRaw);

export const productsCatalog: CatalogItem[] = catalogSchema.parse(productsRaw);

export const servicesCatalog: CatalogItem[] = catalogSchema.parse(servicesRaw);
