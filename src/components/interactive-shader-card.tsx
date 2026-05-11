"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const gradientPalettes = [
  "linear-gradient(130deg,#171717,#252322,#454443,#deddd9,#171717)",
  "linear-gradient(210deg,#171717,#1f2427,#3f3b43,#d1cfc8,#171717)",
  "linear-gradient(165deg,#171717,#27211f,#46423a,#e0ded6,#171717)",
  "linear-gradient(195deg,#171717,#202428,#3b3d45,#d7d4cc,#171717)",
  "linear-gradient(150deg,#171717,#23211f,#433f3a,#dbd8d0,#171717)",
];

const animationVariants = [
  { name: "ambientGradient", backgroundSize: "320% 320%" },
  { name: "ambientGradientReverse", backgroundSize: "340% 340%" },
  { name: "ambientGradientTilt", backgroundSize: "360% 360%" },
  { name: "ambientGradientWave", backgroundSize: "300% 320%" },
];

interface InteractiveShaderCardProps extends React.HTMLAttributes<HTMLDivElement> {
  "aria-label"?: string;
  mode?: "interactive" | "ambient";
  ambientIndex?: number;
}

export default function InteractiveShaderCard({
  className,
  mode = "ambient",
  ambientIndex = 0,
  ...props
}: InteractiveShaderCardProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(true);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  React.useEffect(() => {
    if (mode !== "interactive" || prefersReducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrame: number;
    let bounds = canvas.getBoundingClientRect();
    let pointer = { x: bounds.width / 2, y: bounds.height / 2 };

    const resize = () => {
      bounds = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = bounds.width * dpr;
      canvas.height = bounds.height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    const render = () => {
      ctx.clearRect(0, 0, bounds.width, bounds.height);

      const gradient = ctx.createRadialGradient(
        pointer.x,
        pointer.y,
        10,
        bounds.width / 2,
        bounds.height / 2,
        bounds.width * 0.8
      );
      gradient.addColorStop(0, "rgba(255, 255, 240, 0.9)");
      gradient.addColorStop(0.4, "rgba(222, 221, 217, 0.4)");
      gradient.addColorStop(1, "rgba(23, 23, 23, 0.8)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, bounds.width, bounds.height);

      animationFrame = window.requestAnimationFrame(render);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    };

    const onPointerLeave = () => {
      pointer = { x: bounds.width / 2, y: bounds.height / 2 };
    };

    resize();
    render();

    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [mode, prefersReducedMotion]);

  const ambientStyle = React.useMemo<React.CSSProperties | undefined>(() => {
    if (mode !== "ambient" || prefersReducedMotion) {
      return undefined;
    }

    const palette = gradientPalettes[ambientIndex % gradientPalettes.length];
    const animation =
      animationVariants[(ambientIndex + 1) % animationVariants.length];
    const durationBase = 24 + (ambientIndex % 4) * 3;
    const delay = ((ambientIndex * 1.75) % 9).toFixed(1);
    const direction = ambientIndex % 2 === 0 ? "alternate" : "alternate-reverse";

    return {
      backgroundImage: palette,
      backgroundSize: animation.backgroundSize,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "0% 50%",
      animationName: animation.name,
      animationDuration: `${durationBase}s`,
      animationTimingFunction: "ease-in-out",
      animationIterationCount: "infinite",
      animationDirection: direction,
      animationDelay: `${delay}s`,
    };
  }, [ambientIndex, mode, prefersReducedMotion]);

  return (
    <div
      className={cn("overflow-hidden rounded-[5.5px]", className)}
      {...props}
      role="img"
      aria-hidden={props["aria-label"] ? undefined : true}
    >
      {mode === "interactive" ? (
        prefersReducedMotion ? (
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(222,221,217,0.45),rgba(23,23,23,0.9))]" />
        ) : (
          <canvas ref={canvasRef} className="h-full w-full" />
        )
      ) : (
        <div
          className="h-full w-full"
          style={
            ambientStyle ?? {
              backgroundImage: gradientPalettes[ambientIndex % gradientPalettes.length],
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "0% 50%",
            }
          }
        />
      )}
    </div>
  );
}
