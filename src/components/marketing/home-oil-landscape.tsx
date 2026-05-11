'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';

import { animate } from 'animejs';

import { useReducedMotion } from '@/hooks';

export function HomeOilLandscape() {
  const prefersReducedMotion = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const grainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const animations = [
      frameRef.current
        ? animate(frameRef.current, {
            translateX: ['-0.9%', '0.9%'],
            translateY: ['0%', '1.1%'],
            scale: [1.03, 1.06],
            duration: 26000,
            easing: 'inOutSine',
            loop: true,
            alternate: true,
          })
        : null,
      grainRef.current
        ? animate(grainRef.current, {
            translateX: ['0%', '-1.4%'],
            translateY: ['0%', '1.1%'],
            duration: 18000,
            easing: 'inOutSine',
            loop: true,
            alternate: true,
          })
        : null,
    ].filter(Boolean);

    return () => {
      animations.forEach((animation) => animation?.cancel());
    };
  }, [prefersReducedMotion]);

  return (
    <div aria-hidden className='pointer-events-none fixed inset-0 z-0 overflow-hidden'>
      <div
        ref={frameRef}
        className='absolute inset-[-2%]'
      >
        <Image
          src='/images/dome-night-landscape.jpg'
          alt=''
          fill
          priority
          sizes='100vw'
          className='object-cover object-[center_42%] opacity-[0.78] [filter:brightness(0.34)_contrast(1.1)_saturate(0.78)]'
        />
      </div>

      <div
        ref={grainRef}
        className='absolute inset-0 opacity-[0.18]'
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              112deg,
              rgba(255,255,255,0.015) 0,
              rgba(255,255,255,0.015) 2px,
              transparent 2px,
              transparent 12px
            ),
            repeating-linear-gradient(
              8deg,
              rgba(0,0,0,0.06) 0,
              rgba(0,0,0,0.06) 4px,
              transparent 4px,
              transparent 18px
            )
          `,
        }}
      />

      <div className='absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,transparent_0%,rgba(0,0,0,0.06)_38%,rgba(0,0,0,0.34)_100%)]' />
    </div>
  );
}
