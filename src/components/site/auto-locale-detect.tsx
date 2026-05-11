'use client';

import { useEffect } from 'react';

import { setLocaleAction } from '@/app/actions/set-locale';
import { MARKET_LOCALE_COOKIE } from '@/lib/marketing/runtime';
import { normalizeMarketLocale } from '@/lib/marketing/i18n';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const match = document.cookie.split('; ').find((entry) => entry.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function AutoLocaleDetect() {
  useEffect(() => {
    if (readCookie(MARKET_LOCALE_COOKIE)) {
      return;
    }

    const candidates = [navigator.language, ...navigator.languages];
    const detected = candidates.map(normalizeMarketLocale).find(Boolean);
    if (!detected || detected === 'en') {
      return;
    }

    const formData = new FormData();
    formData.set('locale', detected);
    formData.set('next', window.location.pathname);
    setLocaleAction(formData).catch(() => {
      // Swallow: detection is best-effort.
    });
  }, []);

  return null;
}
