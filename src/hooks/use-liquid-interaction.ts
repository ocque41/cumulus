"use client";

import { useMemo } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  clearLiquidAnimations,
  playLiquidFocus,
  playLiquidHover,
  playLiquidLeave,
  playLiquidPress,
  playLiquidRelease,
} from "@/lib/motion/liquid-presets";

type LiquidInteractionOptions = {
  disabled?: boolean;
};

export function useLiquidInteraction(options: LiquidInteractionOptions = {}) {
  const prefersReducedMotion = useReducedMotion();
  const disabled = options.disabled || prefersReducedMotion;

  return useMemo(
    () => ({
      onMouseEnter: (event: React.MouseEvent<HTMLElement>) => {
        if (disabled) return;
        playLiquidHover(event.currentTarget);
      },
      onMouseLeave: (event: React.MouseEvent<HTMLElement>) => {
        if (disabled) return;
        playLiquidLeave(event.currentTarget);
      },
      onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
        if (disabled) return;
        playLiquidPress(event.currentTarget);
      },
      onPointerUp: (event: React.PointerEvent<HTMLElement>) => {
        if (disabled) return;
        playLiquidRelease(event.currentTarget);
      },
      onFocus: (event: React.FocusEvent<HTMLElement>) => {
        if (disabled) return;
        playLiquidFocus(event.currentTarget);
      },
      onBlur: (event: React.FocusEvent<HTMLElement>) => {
        if (disabled) return;
        clearLiquidAnimations(event.currentTarget);
      },
    }),
    [disabled]
  );
}
