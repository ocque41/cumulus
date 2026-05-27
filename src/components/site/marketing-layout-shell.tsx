'use client';

import type { ReactNode } from 'react';

import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';
import { Toaster } from '@/components/ui/toaster';

type MarketingLayoutShellProps = {
  children: ReactNode;
};

export function MarketingLayoutShell({ children }: MarketingLayoutShellProps) {
  return (
    <div className='min-h-screen flex flex-col'>
      <Header />
      <div className='flex flex-1 flex-col'>
        <div className='flex flex-1 flex-col min-w-0'>
          {children}
        </div>
        <Footer />
      </div>
      <Toaster />
    </div>
  );
}
