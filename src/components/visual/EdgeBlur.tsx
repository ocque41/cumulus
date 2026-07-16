"use client";

// Faithful local derivative of Cult UI's Edge Blur component.
// Upstream source: https://www.cult-ui.com/docs/components/edge-blur (MIT).
const BLUR_LAYERS = [1, 2, 3, 6, 12] as const;

export interface EdgeBlurProps {
  position?: "top" | "bottom";
  /** Height of the decorative edge treatment in CSS pixels. */
  height?: number;
}

function browserSupportsEdgeBlur(): boolean {
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function") {
    return false;
  }

  const blurSupported =
    CSS.supports("backdrop-filter", "blur(1px)") ||
    CSS.supports("-webkit-backdrop-filter", "blur(1px)");
  const maskSupported =
    CSS.supports("mask-image", "linear-gradient(black, transparent)") ||
    CSS.supports("-webkit-mask-image", "linear-gradient(black, transparent)");

  return blurSupported && maskSupported;
}

/**
 * Progressive, masked backdrop blur pinned to a viewport or transformed frame.
 * Unsupported browsers receive no treatment instead of an unmasked blur block.
 */
export function EdgeBlur({ position = "bottom", height = 75 }: EdgeBlurProps) {
  if (!browserSupportsEdgeBlur()) {
    return null;
  }

  const isTop = position === "top";
  const maskImage = `linear-gradient(to ${isTop ? "bottom" : "top"}, black, transparent)`;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 isolate z-40 ${isTop ? "top-0" : "bottom-0"}`}
      data-slot="edge-blur"
      data-position={position}
      style={{ height: Math.max(0, height) }}
    >
      {BLUR_LAYERS.map((blur) => (
        <div
          className="absolute inset-0"
          data-blur={blur}
          key={blur}
          style={{
            backdropFilter: `blur(${blur}px)`,
            WebkitBackdropFilter: `blur(${blur}px)`,
            maskImage,
            WebkitMaskImage: maskImage,
          }}
        />
      ))}
    </div>
  );
}

export function TopBlur({ height = 75 }: Pick<EdgeBlurProps, "height">) {
  return <EdgeBlur height={height} position="top" />;
}

export function BottomBlur({ height = 75 }: Pick<EdgeBlurProps, "height">) {
  return <EdgeBlur height={height} position="bottom" />;
}
