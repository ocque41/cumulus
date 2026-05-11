import * as React from "react";

export interface GrainyGradientProps
  extends React.HTMLAttributes<HTMLDivElement> {
  "aria-label"?: string;
}

export function GrainyGradient({ className, ...props }: GrainyGradientProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(true);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = (event?: MediaQueryListEvent) =>
      setPrefersReducedMotion(event?.matches ?? query.matches);

    update();

    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }

    if (typeof query.addListener === "function") {
      query.addListener(update);
      return () => query.removeListener(update);
    }

    return undefined;
  }, []);

  React.useEffect(() => {
    if (prefersReducedMotion) return;
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
  }, [prefersReducedMotion]);

  return (
    <div
      className={className}
      {...props}
      role="img"
      aria-hidden={props["aria-label"] ? undefined : true}
    >
      {prefersReducedMotion ? (
        <div className="grainy-gradient-fallback" />
      ) : (
        <canvas ref={canvasRef} className="grainy-gradient-canvas" />
      )}
    </div>
  );
}
