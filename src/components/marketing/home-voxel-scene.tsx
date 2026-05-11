'use client';

import { useEffect, useRef } from 'react';

import { ViewTunnelIn } from '@/components/core';
import { VoxelCloud } from '@/components/three';
import { getAdaptiveInstanceCount, useAdaptiveQuality, useIsMobile, useReducedMotion } from '@/hooks';

export type HomeVoxelSceneProps = {
  backgroundColor?: string;
  baseDesktopCount?: number;
  baseMobileCount?: number;
  materialPreset?: 'default' | 'liquid-glass';
  motionStrength?: number;
  reducedMotionFallback?: 'glass-bloom' | 'none';
};

export function HomeVoxelScene({
  backgroundColor = '#141414',
  baseDesktopCount = 2400,
  baseMobileCount = 900,
  materialPreset = 'default',
  motionStrength = 0.8,
  reducedMotionFallback = 'glass-bloom',
}: HomeVoxelSceneProps) {
  const prefersReducedMotion = useReducedMotion();
  const { level } = useAdaptiveQuality();
  const isMobile = useIsMobile();
  const pointerAnimated = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    if (prefersReducedMotion || typeof window === 'undefined') {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      pointerAnimated.current.x = (event.clientX / window.innerWidth - 0.5) * 9;
      pointerAnimated.current.y = -(event.clientY / window.innerHeight - 0.5) * 6;
      pointerAnimated.current.z = 0;
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [prefersReducedMotion]);

  const voxelCount = getAdaptiveInstanceCount(isMobile ? baseMobileCount : baseDesktopCount, level);

  if (prefersReducedMotion) {
    if (reducedMotionFallback === 'none') {
      return null;
    }

    return (
      <div
        aria-hidden
        className='pointer-events-none fixed inset-0 z-0'
        style={{
          background: `
            radial-gradient(circle at 50% 24%, rgba(255,255,255,0.1), transparent 24%),
            radial-gradient(circle at 50% 42%, rgba(215,215,215,0.08), transparent 38%),
            linear-gradient(180deg, ${backgroundColor} 0%, ${backgroundColor} 100%)
          `,
        }}
      />
    );
  }

  return (
    <ViewTunnelIn>
      <VoxelCloud
        count={voxelCount}
        spread={isMobile ? 6.5 : 9.5}
        mousePosition={pointerAnimated}
        repulsionStrength={0.55}
        repulsionRadius={3.2}
        materialPreset={materialPreset}
        motionStrength={motionStrength}
      />
    </ViewTunnelIn>
  );
}
