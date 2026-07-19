import { useEffect, useRef } from "react";
import { animate } from "animejs/animation";
import { createScope } from "animejs/scope";

import { HeroDither } from "@/components/visual/HeroDither";

const HERO_NEAR_VIEWPORT_MARGIN = "240px 0px";

/**
 * The homepage signal is deliberately a composition, not a replacement.
 * The original wave field remains dominant while the newer warp field adds
 * a masked interference current. Anime.js moves the layers as one artwork;
 * each HeroDither still owns its responsive WebGL lifecycle and CSS fallback.
 */
export function HomeHeroDither() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const motionPreference = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    );
    let isNearViewport = typeof IntersectionObserver === "undefined";
    let animationScope: ReturnType<typeof createScope> | undefined;
    let running = false;

    const stop = () => {
      animationScope?.revert();
      animationScope = undefined;
      running = false;
      root.dataset.motion = "static";
    };

    const start = () => {
      if (running) return;
      running = true;
      root.dataset.motion = "active";
      animationScope = createScope({ root }).add(() => {
        animate("[data-hero-dither-layer='legacy']", {
          alternate: true,
          duration: 8_600,
          ease: "inOutSine",
          loop: true,
          opacity: [0.84, 1],
          rotate: ["-0.45deg", "0.55deg"],
          scale: [1.035, 1.105],
          translateX: ["-1.8%", "1.4%"],
          translateY: ["-1.2%", "1.6%"],
        });
        animate("[data-hero-dither-layer='current']", {
          alternate: true,
          duration: 6_400,
          ease: "inOutQuad",
          loop: true,
          opacity: [0.3, 0.66],
          rotate: ["1.2deg", "-1.35deg"],
          scale: [1.12, 1.025],
          translateX: ["3.5%", "-2.8%"],
          translateY: ["2.4%", "-2.1%"],
        });
        animate("[data-hero-dither-orbit]", {
          duration: 13_000,
          ease: "linear",
          loop: true,
          rotate: ["0deg", "360deg"],
          scale: [0.94, 1.08, 0.94],
        });
      });
    };

    const update = () => {
      const shouldRun =
        isNearViewport &&
        !document.hidden &&
        motionPreference?.matches !== true;
      if (shouldRun) start();
      else if (running) stop();
      else root.dataset.motion = "static";
    };

    const observer =
      typeof IntersectionObserver === "undefined"
        ? undefined
        : new IntersectionObserver(
            ([entry]) => {
              isNearViewport = entry?.isIntersecting === true;
              update();
            },
            { rootMargin: HERO_NEAR_VIEWPORT_MARGIN },
          );
    observer?.observe(root);

    const handleVisibility = () => update();
    const handleMotionPreference = () => update();
    document.addEventListener("visibilitychange", handleVisibility);
    motionPreference?.addEventListener?.("change", handleMotionPreference);
    update();

    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      motionPreference?.removeEventListener?.("change", handleMotionPreference);
      animationScope?.revert();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="home-hero__dither-composition"
      data-motion="static"
      data-slot="home-hero-dither-composition"
      ref={rootRef}
    >
      <div
        className="home-hero__dither-layer home-hero__dither-layer--legacy"
        data-hero-dither-layer="legacy"
      >
        <HeroDither
          className="home-hero__dither home-hero__dither--legacy"
          fallbackClassName="home-hero__dither-fallback home-hero__dither-fallback--legacy"
          frame={288}
          maxPixelCount={420_000}
          priority
          scale={0.62}
          shape="wave"
          size={3}
          speed={0.42}
          tone="quiet"
          type="8x8"
        />
      </div>

      <div
        className="home-hero__dither-layer home-hero__dither-layer--current"
        data-hero-dither-layer="current"
      >
        <HeroDither
          className="home-hero__dither home-hero__dither--current"
          fallbackClassName="home-hero__dither-fallback home-hero__dither-fallback--current"
          frame={288}
          maxPixelCount={280_000}
          priority
          scale={0.9}
          shape="warp"
          size={2.25}
          speed={0.85}
          tone="muted"
          type="8x8"
        />
      </div>

      <div className="home-hero__dither-orbit" data-hero-dither-orbit />
    </div>
  );
}
