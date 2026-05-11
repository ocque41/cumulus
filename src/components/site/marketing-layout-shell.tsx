'use client';

import type { ReactNode } from 'react';

import { usePathname } from 'next/navigation';

import { Header } from '@/components/site/header';
import { DesktopNav } from '@/components/site/nav';
import { Footer } from '@/components/site/footer';
import { Toaster } from '@/components/ui/toaster';

type MarketingLayoutShellProps = {
  children: ReactNode;
};

export function MarketingLayoutShell({ children }: MarketingLayoutShellProps) {
  const pathname = usePathname();
  const isFocusedMarketingRoute = pathname === '/';

  return (
    <div className='min-h-screen flex flex-col'>
      <Header />
      <div
        className={isFocusedMarketingRoute
          ? 'mx-auto flex w-full max-w-[1760px] flex-1 px-4 pb-0 pt-12 lg:px-10'
          : 'mx-auto flex w-full max-w-[1400px] flex-1 gap-12 px-4 pb-0 pt-12 lg:px-8'}
      >
        {!isFocusedMarketingRoute ? (
          <aside className='hidden w-40 shrink-0 xl:block'>
            <div className='sticky top-[50vh] -translate-y-1/2'>
              <DesktopNav />
            </div>
          </aside>
        ) : null}
        <div className='flex flex-1 flex-col min-w-0'>
          <main className='flex-1'>{children}</main>
          <Footer />
        </div>
      </div>
      <Toaster />
      <Toaster />
    </div>
  );
}
