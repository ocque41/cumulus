'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { MARKET_LOCALE_COOKIE } from '@/lib/marketing/runtime';
import { normalizeMarketLocale } from '@/lib/marketing/i18n';

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setLocaleAction(formData: FormData): Promise<void> {
  const raw = formData.get('locale');
  if (typeof raw !== 'string') {
    return;
  }

  const locale = normalizeMarketLocale(raw);
  if (!locale) {
    return;
  }

  const store = await cookies();
  store.set(MARKET_LOCALE_COOKIE, locale, {
    maxAge: ONE_YEAR,
    sameSite: 'lax',
    path: '/',
  });

  const nextPath = formData.get('next');
  revalidatePath(typeof nextPath === 'string' && nextPath.startsWith('/') ? nextPath : '/');
}
