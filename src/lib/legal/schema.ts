import { z } from "zod";

export const legalMetaSchema = z.object({
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
    lastUpdated: z.string(),
    defaultLanguage: z.enum(["es", "en"]),
    noindexUntilApproved: z.boolean(),
  }),
});

export type LegalMeta = z.infer<typeof legalMetaSchema>;

export const processorSchema = z.object({
  name: z.string(),
  category: z.string(),
  role: z.string(),
  dataTypes: z.array(z.string()),
  purpose: z.string(),
  docsUrl: z.string().url(),
  privacyUrl: z.string().url(),
});

export const processorsSchema = z.array(processorSchema);

export type Processor = z.infer<typeof processorSchema>;

export const catalogItemSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
});

export const catalogSchema = z.array(catalogItemSchema);

export type CatalogItem = z.infer<typeof catalogItemSchema>;

export type SupportedLocale = "es" | "en";

export type LegalSlug = "privacy-policy" | "terms-of-service";

export const supportedLocales: SupportedLocale[] = ["es", "en"];

export function assertSupportedLocale(locale: string): SupportedLocale {
  if (supportedLocales.includes(locale as SupportedLocale)) {
    return locale as SupportedLocale;
  }

  throw new Error(`Unsupported locale: ${locale}`);
}
