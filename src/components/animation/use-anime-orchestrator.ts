'use client';

import { useEffect, type RefObject } from 'react';

import {
  animate,
  createTimeline,
  remove,
  stagger,
  type AnimationParams,
  type DefaultsParams,
} from 'animejs';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export type HeroTimelineStep = {
  selector: string;
  params: AnimationParams;
  offset?: string;
};

type HeroTimelineOptions = {
  defaults?: DefaultsParams;
};

export function useHeroTimeline<T extends HTMLElement>(
  rootRef: RefObject<T | null>,
  steps: HeroTimelineStep[],
  options: HeroTimelineOptions = {}
) {
  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }
    const root = rootRef.current;
    if (!root || steps.length === 0) {
      return;
    }

    const timeline = createTimeline({
      defaults: {
        ease: 'easeOutExpo',
        duration: 900,
        ...(options.defaults ?? {}),
      },
    });

    for (const step of steps) {
      const targets = root.querySelectorAll<HTMLElement>(step.selector);
      if (targets.length === 0) {
        continue;
      }
      if (step.offset) {
        timeline.add(targets, step.params, step.offset);
      } else {
        timeline.add(targets, step.params);
      }
    }

    return () => {
      timeline.cancel();
      const selectors = steps.map((step) => step.selector).join(',');
      if (selectors.length > 0) {
        remove(root.querySelectorAll(selectors));
      }
    };
  }, [rootRef, steps, options.defaults]);
}

type IdleFloatOptions = {
  selector: string;
  amplitude?: number;
  duration?: number;
  staggerMs?: number;
};

export function useIdleFloat<T extends HTMLElement>(
  rootRef: RefObject<T | null>,
  options: IdleFloatOptions
) {
  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const targets = root.querySelectorAll<HTMLElement>(options.selector);
    if (targets.length === 0) {
      return;
    }

    const amp = options.amplitude ?? 5;
    const duration = options.duration ?? 2800;
    const staggerMs = options.staggerMs ?? 180;

    const anim = animate(targets, {
      translateY: [0, -amp, 0],
      opacity: [0.65, 1, 0.65],
      delay: stagger(staggerMs),
      duration,
      ease: 'inOutSine',
      loop: true,
    });

    return () => {
      anim.cancel();
      remove(targets);
    };
  }, [rootRef, options.selector, options.amplitude, options.duration, options.staggerMs]);
}

type RevealOnIntersectOptions = {
  groupSelector: string;
  revealSelector: string;
  threshold?: number;
  rootMargin?: string;
  staggerMs?: number;
  duration?: number;
  distance?: number;
};

export function useRevealOnIntersect<T extends HTMLElement>(
  rootRef: RefObject<T | null>,
  options: RevealOnIntersectOptions
) {
  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const {
      groupSelector,
      revealSelector,
      threshold = 0.18,
      rootMargin = '0px 0px -10% 0px',
      staggerMs = 120,
      duration = 800,
      distance = 28,
    } = options;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }
          const group = entry.target as HTMLElement;
          if (group.dataset.domeRevealed === 'true') {
            observer.unobserve(group);
            continue;
          }
          const revealTargets = group.querySelectorAll<HTMLElement>(revealSelector);
          animate(revealTargets, {
            opacity: [0, 1],
            translateY: [distance, 0],
            delay: stagger(staggerMs),
            duration,
            ease: 'easeOutExpo',
          });
          group.dataset.domeRevealed = 'true';
          observer.unobserve(group);
        }
      },
      { threshold, rootMargin }
    );

    const groups = root.querySelectorAll<HTMLElement>(groupSelector);
    groups.forEach((group) => observer.observe(group));

    return () => {
      observer.disconnect();
    };
  }, [
    rootRef,
    options.groupSelector,
    options.revealSelector,
    options.threshold,
    options.rootMargin,
    options.staggerMs,
    options.duration,
    options.distance,
  ]);
}
