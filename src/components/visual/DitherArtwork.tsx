/* eslint-disable react-refresh/only-export-components */
import {
  useEffect,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import { ORDERED_BAYER_4X4 } from "./bayer";

const ARTWORK_WIDTH = 128;
const ARTWORK_HEIGHT = 80;
/** 13.3fps keeps the pixel field lively without running a 60fps card wall. */
export const DITHER_FRAME_INTERVAL_MS = 75;
const NEAR_VIEWPORT_MARGIN = "180px 0px";
const TAU = Math.PI * 2;

const PALETTE = {
  black: [0, 0, 0, 255],
  surface: [26, 26, 26, 255],
  quiet: [112, 112, 112, 255],
  muted: [202, 202, 202, 255],
} as const;

type Pixel = readonly [number, number, number, number];

const DITHER_LEVELS: readonly Pixel[] = [
  PALETTE.black,
  PALETTE.surface,
  PALETTE.quiet,
  PALETTE.muted,
];
const COLUMN_POSITIONS = Float32Array.from(
  { length: ARTWORK_WIDTH },
  (_, column) => column / Math.max(1, ARTWORK_WIDTH - 1),
);
const ROW_POSITIONS = Float32Array.from(
  { length: ARTWORK_HEIGHT },
  (_, row) => row / Math.max(1, ARTWORK_HEIGHT - 1),
);
const BAYER_THRESHOLDS = Float32Array.from(
  ORDERED_BAYER_4X4,
  (value) => (value + 0.5) / 16,
);
const imageBuffers = new WeakMap<CanvasRenderingContext2D, ImageData>();

interface RuntimeEntry {
  drawable: boolean;
  draw: (seconds: number) => boolean;
  element: HTMLElement;
  visible: boolean;
}

interface RuntimeSubscription {
  markUnavailable: () => void;
  redraw: () => void;
  unsubscribe: () => void;
}

const runtimeEntries = new Map<Element, RuntimeEntry>();
let runtimeObserver: IntersectionObserver | null | undefined;
let runtimeTimer: ReturnType<typeof setTimeout> | undefined;
let runtimeFrame: number | undefined;
let lastPaint = -DITHER_FRAME_INTERVAL_MS;
let reducedMotion = false;
let documentVisible = true;
let motionQuery: MediaQueryList | undefined;
let runtimeReady = false;
let runtimeMotionChange: (() => void) | undefined;
let runtimeVisibilityChange: (() => void) | undefined;

function writePixel(
  data: Uint8ClampedArray,
  offset: number,
  pixel: Pixel,
) {
  data[offset] = pixel[0];
  data[offset + 1] = pixel[1];
  data[offset + 2] = pixel[2];
  data[offset + 3] = pixel[3];
}

/** Stable FNV-1a seed used by both low-cost and WebGL post artwork. */
export function stableDitherSeed(value: string): number {
  let seed = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    seed ^= value.charCodeAt(index);
    seed = Math.imul(seed, 16_777_619);
  }
  return seed >>> 0;
}

function seededUnit(seed: number, salt: number): number {
  let value = seed ^ Math.imul(salt + 1, 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 4_294_967_295;
}

function fieldValue(
  kind: number,
  x: number,
  y: number,
  phase: number,
  originX: number,
  originY: number,
  skew: number,
) {
  switch (kind) {
    case 0:
      return (
        Math.sin((x * 7.5 + y * 3.2 * skew + phase) * TAU) * 0.72 +
        Math.cos((y * 5.4 - x * 1.8 - phase * 0.43) * TAU) * 0.28
      );
    case 1:
      return Math.cos(
        (Math.sqrt((x - originX) ** 2 + (y - originY) ** 2) * 8.5 - phase) *
          TAU,
      );
    case 2:
      return (
        Math.sin((x * 5.7 + phase * 0.86) * TAU) +
        Math.cos((y * 7.4 - phase * 0.64) * TAU)
      ) / 2;
    case 3:
      return (
        Math.sin((x * y * 13 + x * 2.7 - y * 1.9 + phase) * TAU) * 0.68 +
        Math.cos(((x + y) * 4.2 - phase * 0.55) * TAU) * 0.32
      );
    default:
      return Math.cos(
        ((x - y * skew) * 5.6 +
          Math.sqrt((x - originX) ** 2 + (y - originY) ** 2) * 3.8 +
          phase) *
          TAU,
      );
  }
}

function clampUnit(value: number) {
  return Math.min(1, Math.max(0, value));
}

function paintArtwork(
  context: CanvasRenderingContext2D,
  seed: number,
  seconds: number,
) {
  let image = imageBuffers.get(context);
  if (!image) {
    image = context.createImageData(ARTWORK_WIDTH, ARTWORK_HEIGHT);
    imageBuffers.set(context, image);
  }

  const phase =
    seededUnit(seed, 0) * 8 + seconds * (0.72 + seededUnit(seed, 1) * 0.36);
  const kind = seed % 5;
  const originX = 0.24 + seededUnit(seed, 2) * 0.52;
  const originY = 0.2 + seededUnit(seed, 3) * 0.6;
  const skew = 0.68 + seededUnit(seed, 4) * 1.16;
  const crossOffset = seededUnit(seed, 5);
  const signalAngle = seededUnit(seed, 8) * TAU + phase * TAU * 0.72;
  const signalX = 0.5 + Math.sin(signalAngle) * 0.44;
  const signalY = 0.5 + Math.cos(signalAngle * 0.73 + kind) * 0.39;

  for (let row = 0; row < ARTWORK_HEIGHT; row += 1) {
    const y = ROW_POSITIONS[row] ?? 0;
    for (let column = 0; column < ARTWORK_WIDTH; column += 1) {
      const x = COLUMN_POSITIONS[column] ?? 0;
      const wave = fieldValue(
        kind,
        x,
        y,
        phase,
        originX,
        originY,
        skew,
      );
      const crossWave = Math.sin(
        (x * 2.4 - y * 1.7 + phase * 0.82 + crossOffset) * TAU,
      );
      const signalDistance =
        (x - signalX) * (x - signalX) + (y - signalY) * (y - signalY);
      const movingBloom = Math.max(0, 1 - signalDistance * 48);
      const luminance = clampUnit(
        0.08 + ((wave * 0.76 + crossWave * 0.24 + 1) / 2) * 0.84 +
          movingBloom * 0.32,
      );
      const threshold =
        BAYER_THRESHOLDS[(row % 4) * 4 + (column % 4)] ?? 0.5;
      const scaledLevel = luminance * (DITHER_LEVELS.length - 1);
      const lowerLevel = Math.floor(scaledLevel);
      const level = Math.min(
        DITHER_LEVELS.length - 1,
        lowerLevel + (scaledLevel - lowerLevel > threshold ? 1 : 0),
      );
      const offset = (row * ARTWORK_WIDTH + column) * 4;
      writePixel(image.data, offset, DITHER_LEVELS[level] ?? PALETTE.black);
    }
  }

  context.putImageData(image, 0, 0);

  // A tiny moving hot signal makes the temporal direction obvious while the
  // Bayer field remains the primary artwork and color never carries meaning.
  const accentX = Math.round(signalX * (ARTWORK_WIDTH - 3));
  const accentY = Math.round(signalY * (ARTWORK_HEIGHT - 6));
  context.fillStyle = "#ff4d00";
  context.fillRect(accentX, accentY, 2, 5);
  context.fillRect(
    Math.round((1 - signalX) * (ARTWORK_WIDTH - 2)),
    Math.round((1 - signalY) * (ARTWORK_HEIGHT - 2)),
    1,
    1,
  );
}

function supportsAnimationSchedule() {
  return (
    typeof requestAnimationFrame === "function" &&
    typeof cancelAnimationFrame === "function" &&
    typeof setTimeout === "function" &&
    typeof clearTimeout === "function"
  );
}

function canAnimate() {
  return documentVisible && !reducedMotion && supportsAnimationSchedule();
}

function hasDrawableVisibleEntries() {
  for (const entry of runtimeEntries.values()) {
    if (entry.visible && entry.drawable) return true;
  }
  return false;
}

function runtimeNow() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

function cancelRuntimeSchedule() {
  if (runtimeTimer !== undefined) {
    clearTimeout(runtimeTimer);
    runtimeTimer = undefined;
  }
  if (runtimeFrame !== undefined) {
    cancelAnimationFrame(runtimeFrame);
    runtimeFrame = undefined;
  }
}

function paintEntry(entry: RuntimeEntry, seconds: number) {
  let painted = false;
  try {
    painted = entry.draw(seconds);
  } catch {
    painted = false;
  }

  entry.drawable = painted;
  if (!painted) delete entry.element.dataset.rendered;
  entry.element.dataset.motion =
    painted && entry.visible && canAnimate() ? "active" : "static";
  return painted;
}

function paintVisibleEntries(seconds: number, retryUnavailable = false) {
  let painted = false;
  for (const entry of runtimeEntries.values()) {
    if (!entry.visible || (!retryUnavailable && !entry.drawable)) continue;
    if (paintEntry(entry, seconds)) painted = true;
  }
  return painted;
}

function scheduleRuntimePaint() {
  if (
    runtimeTimer !== undefined ||
    runtimeFrame !== undefined ||
    !canAnimate() ||
    !hasDrawableVisibleEntries()
  ) {
    return;
  }

  const delay = Math.max(
    0,
    DITHER_FRAME_INTERVAL_MS - Math.max(0, runtimeNow() - lastPaint),
  );
  runtimeTimer = setTimeout(() => {
    runtimeTimer = undefined;
    if (!canAnimate() || !hasDrawableVisibleEntries()) return;

    runtimeFrame = requestAnimationFrame((timestamp) => {
      runtimeFrame = undefined;
      if (!canAnimate() || !hasDrawableVisibleEntries()) return;

      lastPaint = runtimeNow();
      paintVisibleEntries(timestamp / 1_000);
      scheduleRuntimePaint();
    });
  }, delay);
}

function reconcileRuntimeSchedule() {
  if (!canAnimate() || !hasDrawableVisibleEntries()) {
    cancelRuntimeSchedule();
    return;
  }
  scheduleRuntimePaint();
}

function drawVisibleStaticOrAnimatedFrame() {
  cancelRuntimeSchedule();
  const animated = canAnimate();
  const timestamp = animated ? runtimeNow() : 0;
  const painted = paintVisibleEntries(timestamp / 1_000, true);
  if (animated && painted) lastPaint = timestamp;
  reconcileRuntimeSchedule();
}

function setMotionState() {
  drawVisibleStaticOrAnimatedFrame();
}

function setEntryUnavailable(entry: RuntimeEntry) {
  entry.drawable = false;
  entry.element.dataset.motion = "static";
  delete entry.element.dataset.rendered;
  reconcileRuntimeSchedule();
}

function redrawEntry(entry: RuntimeEntry) {
  if (!entry.visible) {
    setEntryUnavailable(entry);
    return;
  }

  const hadDrawableVisibleEntry = hasDrawableVisibleEntries();
  const timestamp = canAnimate() ? runtimeNow() : 0;
  const painted = paintEntry(entry, timestamp / 1_000);
  if (canAnimate() && painted && !hadDrawableVisibleEntry) {
    lastPaint = timestamp;
  }
  reconcileRuntimeSchedule();
}

function updateIntersections(records: IntersectionObserverEntry[]) {
  const hadDrawableVisibleEntry = hasDrawableVisibleEntries();
  const animated = canAnimate();
  const timestamp = animated ? runtimeNow() : 0;
  let paintedOnEntry = false;

  for (const record of records) {
    const entry = runtimeEntries.get(record.target);
    if (!entry) continue;
    entry.visible = record.isIntersecting;
    if (!record.isIntersecting) {
      entry.element.dataset.motion = "static";
      continue;
    }

    if (paintEntry(entry, timestamp / 1_000)) paintedOnEntry = true;
  }

  if (animated && paintedOnEntry && !hadDrawableVisibleEntry) {
    lastPaint = timestamp;
  }
  reconcileRuntimeSchedule();
}

function initializeRuntime() {
  if (
    runtimeReady ||
    typeof window === "undefined" ||
    typeof document === "undefined"
  ) {
    return;
  }

  runtimeReady = true;
  documentVisible = document.visibilityState !== "hidden";
  motionQuery = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : undefined;
  reducedMotion = motionQuery?.matches ?? false;

  const onMotionChange = () => {
    reducedMotion = motionQuery?.matches ?? false;
    setMotionState();
  };
  const onVisibilityChange = () => {
    documentVisible = document.visibilityState !== "hidden";
    setMotionState();
  };
  runtimeMotionChange = onMotionChange;
  runtimeVisibilityChange = onVisibilityChange;

  if (typeof motionQuery?.addEventListener === "function") {
    motionQuery.addEventListener("change", onMotionChange);
  } else {
    motionQuery?.addListener?.(onMotionChange);
  }
  document.addEventListener("visibilitychange", onVisibilityChange);

  if (typeof IntersectionObserver === "undefined") {
    runtimeObserver = null;
  } else {
    runtimeObserver = new IntersectionObserver(
      updateIntersections,
      { rootMargin: NEAR_VIEWPORT_MARGIN },
    );
  }
}

function cleanupRuntime() {
  cancelRuntimeSchedule();
  runtimeObserver?.disconnect();
  if (runtimeMotionChange) {
    if (typeof motionQuery?.removeEventListener === "function") {
      motionQuery.removeEventListener("change", runtimeMotionChange);
    } else {
      motionQuery?.removeListener?.(runtimeMotionChange);
    }
  }
  if (runtimeVisibilityChange) {
    document.removeEventListener("visibilitychange", runtimeVisibilityChange);
  }
  runtimeObserver = undefined;
  motionQuery = undefined;
  runtimeMotionChange = undefined;
  runtimeVisibilityChange = undefined;
  runtimeReady = false;
  lastPaint = -DITHER_FRAME_INTERVAL_MS;
}

function subscribeToDitherRuntime(
  element: HTMLElement,
  draw: (seconds: number) => boolean,
): RuntimeSubscription {
  initializeRuntime();
  const entry: RuntimeEntry = {
    drawable: false,
    draw,
    element,
    visible: false,
  };
  runtimeEntries.set(element, entry);
  element.dataset.motion = "static";
  runtimeObserver?.observe(element);

  return {
    markUnavailable: () => setEntryUnavailable(entry),
    redraw: () => redrawEntry(entry),
    unsubscribe: () => {
      runtimeObserver?.unobserve(element);
      runtimeEntries.delete(element);
      if (runtimeEntries.size === 0) {
        cleanupRuntime();
      } else {
        reconcileRuntimeSchedule();
      }
    },
  };
}

interface DitherArtworkBaseProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  children?: ReactNode;
  seed: string;
  variant?: string;
}

export type DitherArtworkProps = DitherArtworkBaseProps &
  (
    | { decorative: true; label?: never }
    | { decorative?: false; label: string }
  );

/**
 * Low-resolution, Canvas2D dither field for repeated editorial artwork.
 * All visible instances share one observer, motion query, visibility listener,
 * and 13.3fps scheduler; unsupported browsers retain the CSS fallback.
 */
export function DitherArtwork({
  children,
  className = "",
  decorative = false,
  label,
  seed,
  variant = "field",
  ...props
}: DitherArtworkProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const numericSeed = useMemo(
    () => stableDitherSeed(`${seed}:${variant}`),
    [seed, variant],
  );

  useEffect(() => {
    const element = rootRef.current;
    const canvas = canvasRef.current;
    if (!element || !canvas) return;

    delete element.dataset.rendered;
    element.dataset.motion = "static";
    // Without an observer we deliberately keep the static CSS frame and avoid
    // allocating a context for every card in older or test environments.
    if (typeof IntersectionObserver === "undefined") return;

    let context: CanvasRenderingContext2D | null = null;
    let contextLost = false;
    const subscriptionRef: { current?: RuntimeSubscription } = {};

    const showFallback = () => {
      delete element.dataset.rendered;
      element.dataset.motion = "static";
    };

    const draw = (seconds: number) => {
      if (contextLost) {
        showFallback();
        return false;
      }

      try {
        context ??= canvas.getContext("2d", { alpha: false });
        if (!context) {
          showFallback();
          return false;
        }
        paintArtwork(context, numericSeed, seconds);
        element.dataset.rendered = "true";
        return true;
      } catch {
        context = null;
        showFallback();
        return false;
      }
    };

    const onContextLost = () => {
      contextLost = true;
      context = null;
      showFallback();
      subscriptionRef.current?.markUnavailable();
    };
    const onContextRestored = () => {
      contextLost = false;
      context = null;
      showFallback();
      subscriptionRef.current?.redraw();
    };

    showFallback();
    canvas.addEventListener("contextlost", onContextLost);
    canvas.addEventListener("contextrestored", onContextRestored);
    const subscription = subscribeToDitherRuntime(element, draw);
    subscriptionRef.current = subscription;

    return () => {
      canvas.removeEventListener("contextlost", onContextLost);
      canvas.removeEventListener("contextrestored", onContextRestored);
      subscription.unsubscribe();
    };
  }, [numericSeed]);

  return (
    <div
      {...props}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
      className={`dither-artwork ${className}`.trim()}
      data-dither-seed={numericSeed}
      data-motion="static"
      data-slot="dither-artwork"
      ref={rootRef}
      role={decorative ? undefined : "img"}
    >
      <div aria-hidden="true" className="dither-artwork__fallback" />
      <canvas
        aria-hidden="true"
        className="dither-artwork__canvas"
        height={ARTWORK_HEIGHT}
        ref={canvasRef}
        width={ARTWORK_WIDTH}
      />
      {children}
    </div>
  );
}
