'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname } from 'next/navigation';

import { setLocaleAction } from '@/app/actions/set-locale';
import { normalizeMarketLocale, t } from '@/lib/marketing/i18n';
import { PHRASES } from '@/lib/marketing/phrases';
import { MARKET_LOCALE_COOKIE } from '@/lib/marketing/runtime';
import type { MarketLocale } from '@/lib/marketing/schema';
import { cn } from '@/lib/utils';

type LanguageSwitcherProps = {
  defaultLocale?: MarketLocale;
  className?: string;
};

const OPTIONS: Array<{ value: MarketLocale; label: string }> = [
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES' },
];

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const match = document.cookie.split('; ').find((entry) => entry.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function LanguageSwitcher({ defaultLocale = 'en', className }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [locale, setLocale] = useState<MarketLocale>(defaultLocale);

  useEffect(() => {
    const cookieValue = readCookie(MARKET_LOCALE_COOKIE);
    const normalized = normalizeMarketLocale(cookieValue);
    if (normalized) {
      setLocale(normalized);
      return;
    }
    const fromBrowser = [navigator.language, ...(navigator.languages ?? [])]
      .map(normalizeMarketLocale)
      .find(Boolean);
    if (fromBrowser) {
      setLocale(fromBrowser);
    }
  }, []);

  return (
    <div
      role='group'
      aria-label={t(locale, PHRASES.language)}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.02] p-[3px] font-mono text-[0.7rem] uppercase tracking-[0.18em]',
        className
      )}
    >
      {OPTIONS.map((option) => {
        const isActive = option.value === locale;
        return (
          <form
            key={option.value}
            action={(formData) => {
              formData.set('next', pathname ?? '/');
              startTransition(() => {
                setLocale(option.value);
                return setLocaleAction(formData);
              });
            }}
            className='contents'
          >
            <input type='hidden' name='locale' value={option.value} />
            <button
              type='submit'
              disabled={isActive || isPending}
              aria-pressed={isActive}
              className={cn(
                'rounded-full px-3 py-1',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-[color:var(--muted)]'
              )}
            >
              {option.label}
            </button>
          </form>
        );
      })}
    </div>
  );
}
