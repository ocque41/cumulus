"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { animate, createScope, createTimeline, onScroll, stagger } from "animejs";

export function CumulusCreateMotion({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;

    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const scope = createScope({ root }).add(() => {
      createTimeline({ defaults: { duration: 720, ease: "outExpo" } })
        .add("[data-create-logo]", {
          opacity: [0, 1],
          scale: [0.92, 1],
          translateY: [10, 0],
        })
        .add(
          "[data-create-title]",
          {
            opacity: [0, 1],
            translateY: [34, 0],
          },
          "-=480",
        )
        .add(
          "[data-create-command]",
          {
            opacity: [0, 1],
            translateY: [18, 0],
          },
          "-=430",
        );

      animate("[data-create-reveal]", {
        opacity: [0, 1],
        translateY: [22, 0],
        delay: stagger(70),
        duration: 620,
        ease: "outExpo",
      });

      animate("[data-create-command]", {
        boxShadow: ["0 0 0 rgba(245, 245, 245, 0)", "0 16px 52px rgba(245, 245, 245, 0.12)"],
        delay: 220,
        duration: 900,
        ease: "outExpo",
      });

      animate("[data-create-float]", {
        translateY: [0, -10],
        rotate: [-0.4, 0.4],
        duration: 3200,
        alternate: true,
        loop: true,
        ease: "inOutSine",
      });

      root.querySelectorAll<HTMLElement>("[data-create-section]").forEach((section) => {
        animate(section, {
          opacity: [0.72, 1],
          translateY: [18, 0],
          duration: 680,
          ease: "outExpo",
          autoplay: onScroll({
            target: section,
            enter: "bottom bottom",
            leave: "top top",
            repeat: true,
          }),
        });
      });
    });

    return () => scope.revert();
  }, []);

  return <div ref={rootRef}>{children}</div>;
}
