'use server';

import type { ProductId } from '@/lib/marketing/products/types';
import { PRODUCT_ORDER } from '@/lib/marketing/products';
import { normalizeMarketLocale } from '@/lib/marketing/i18n';

export type ContactSubmission = {
  name: string;
  email: string;
  company?: string;
  message: string;
  products: ProductId[];
  locale: string;
};

export type ContactActionResult =
  | { ok: true }
  | { ok: false; error: string };

const PRODUCT_SET = new Set<ProductId>(PRODUCT_ORDER);

function parseProducts(raw: unknown): ProductId[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const seen = new Set<ProductId>();
  for (const value of raw) {
    if (typeof value === 'string' && PRODUCT_SET.has(value as ProductId)) {
      seen.add(value as ProductId);
    }
  }
  return Array.from(seen);
}

export async function submitContactAction(payload: {
  name: string;
  email: string;
  company?: string;
  message: string;
  products: string[];
  locale: string;
}): Promise<ContactActionResult> {
  const name = payload.name?.trim();
  const email = payload.email?.trim();
  const message = payload.message?.trim();

  if (!name || !email || !message) {
    return { ok: false, error: 'missing_fields' };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'invalid_email' };
  }

  const submission: ContactSubmission = {
    name,
    email,
    company: payload.company?.trim() || undefined,
    message,
    products: parseProducts(payload.products),
    locale: normalizeMarketLocale(payload.locale) ?? 'en',
  };

  console.info('[contact] submission received', submission);

  return { ok: true };
}
