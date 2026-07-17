"use client";

/**
 * Responsive local derivative of Cult UI's Hero Dithering visual (MIT):
 * https://www.cult-ui.com/docs/components/hero-dithering
 * Shader implementation: Paper Design Shaders (Apache-2.0).
 */
import * as React from "react";
import {
  defaultPatternSizing,
  ditheringFragmentShader,
  DitheringShapes,
  DitheringTypes,
  getShaderColorFromString,
  ShaderFitOptions,
  ShaderMount,
  type DitheringShape,
  type DitheringType,
  type DitheringUniforms,
  type ShaderMountUniforms,
} from "@paper-design/shaders";

export interface HeroDitherProps
  extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  /** Apply the fallback's radial fade to the whole visual, including WebGL. */
  fade?: boolean;
  shape?: DitheringShape;
  type?: DitheringType;
  size?: number;
  frame?: number;
  speed?: number;
  /** Hard device-pixel-ratio ceiling, enforced through the pixel budget. */
  maxPixelRatio?: number;
  /** Absolute upper bound for rendered shader pixels. */
  maxPixelCount?: number;
  fallbackClassName?: string;
}

interface ShaderBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  onError: () => void;
}

interface ShaderBoundaryState {
  failed: boolean;
}

class ShaderBoundary extends React.Component<
  ShaderBoundaryProps,
  ShaderBoundaryState
> {
  state: ShaderBoundaryState = { failed: false };

  static getDerivedStateFromError(): ShaderBoundaryState {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

interface SafeDitheringProps {
  frame: number;
  maxPixelCount: number;
  minPixelRatio: number;
  onError: () => void;
  shape: DitheringShape;
  size: number;
  speed: number;
  type: DitheringType;
}

type DitheringMountUniforms = DitheringUniforms & ShaderMountUniforms;
type ShaderHostElement = HTMLDivElement & { paperShaderMount?: ShaderMount };

const DITHER_COLOR_BACK = getShaderColorFromString("#000000");
const DITHER_COLOR_FRONT = getShaderColorFromString("#5f5f5f");

function createDitheringUniforms(
  shape: DitheringShape,
  size: number,
  type: DitheringType,
): DitheringMountUniforms {
  const uniforms = {
    u_colorBack: DITHER_COLOR_BACK,
    u_colorFront: DITHER_COLOR_FRONT,
    u_fit: ShaderFitOptions.cover,
    u_offsetX: defaultPatternSizing.offsetX,
    u_offsetY: defaultPatternSizing.offsetY,
    u_originX: defaultPatternSizing.originX,
    u_originY: defaultPatternSizing.originY,
    u_pxSize: size,
    u_rotation: defaultPatternSizing.rotation,
    u_scale: 0.62,
    u_shape: DitheringShapes[shape],
    u_type: DitheringTypes[type],
    u_worldHeight: defaultPatternSizing.worldHeight,
    u_worldWidth: defaultPatternSizing.worldWidth,
  } satisfies DitheringUniforms;

  return uniforms as DitheringMountUniforms;
}

function releaseShaderElement(
  element: ShaderHostElement,
  mount?: ShaderMount,
) {
  const recoverableMount = mount ?? element.paperShaderMount;
  try {
    recoverableMount?.dispose();
  } catch {
    // Continue with local cleanup if a partially initialized mount cannot dispose.
  }

  // ShaderMount prepends its canvas before WebGL/program initialization. If its
  // constructor throws, JavaScript does not return the instance, so release any
  // context and canvas left in this otherwise childless, dedicated mount point.
  element
    .querySelectorAll<HTMLCanvasElement>(":scope > canvas")
    .forEach((canvas) => {
      try {
        canvas
          .getContext("webgl2")
          ?.getExtension("WEBGL_lose_context")
          ?.loseContext();
      } catch {
        // Removing the failed canvas is still the safest available local fallback.
      }
      canvas.remove();
    });

  element.removeAttribute("data-paper-shader");
  delete element.paperShaderMount;
}

/**
 * Local adapter for the image-free Dithering shader. Paper's React wrapper
 * initializes inside an unhandled async function, turning a synchronous
 * ShaderMount constructor error into an unhandled rejection. Keeping the
 * vanilla constructor inside this effect makes that failure locally catchable.
 */
function SafeDithering({
  frame,
  maxPixelCount,
  minPixelRatio,
  onError,
  shape,
  size,
  speed,
  type,
}: SafeDitheringProps) {
  const elementRef = React.useRef<ShaderHostElement>(null);
  const shaderRef = React.useRef<ShaderMount | null>(null);
  const failedRef = React.useRef(false);
  const uniforms = React.useMemo(
    () => createDitheringUniforms(shape, size, type),
    [shape, size, type],
  );
  const [initialSettings] = React.useState(() => ({
    frame,
    maxPixelCount,
    minPixelRatio,
    uniforms,
  }));

  const handleFailure = React.useCallback(
    (mount?: ShaderMount) => {
      if (failedRef.current) return;
      failedRef.current = true;
      shaderRef.current = null;

      if (elementRef.current) {
        releaseShaderElement(elementRef.current, mount);
      }
      onError();
    },
    [onError],
  );

  const updateShader = React.useCallback(
    (update: (mount: ShaderMount) => void) => {
      const mount = shaderRef.current;
      if (!mount || failedRef.current) return;

      try {
        update(mount);
      } catch {
        handleFailure(mount);
      }
    },
    [handleFailure],
  );

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element || failedRef.current) return;

    try {
      const mount = new ShaderMount(
        element,
        ditheringFragmentShader,
        initialSettings.uniforms,
        undefined,
        // Start paused so a late constructor failure cannot strand a rAF before
        // ShaderMount publishes its recoverable instance on the parent element.
        0,
        initialSettings.frame,
        initialSettings.minPixelRatio,
        initialSettings.maxPixelCount,
      );
      shaderRef.current = mount;

      return () => {
        if (shaderRef.current !== mount) return;
        shaderRef.current = null;
        releaseShaderElement(element, mount);
      };
    } catch {
      handleFailure();
    }
  }, [handleFailure, initialSettings]);

  React.useEffect(() => {
    updateShader((mount) => mount.setUniforms(uniforms));
  }, [uniforms, updateShader]);

  React.useEffect(() => {
    updateShader((mount) => mount.setSpeed(speed));
  }, [speed, updateShader]);

  React.useEffect(() => {
    updateShader((mount) => mount.setMaxPixelCount(maxPixelCount));
  }, [maxPixelCount, updateShader]);

  React.useEffect(() => {
    updateShader((mount) => mount.setMinPixelRatio(minPixelRatio));
  }, [minPixelRatio, updateShader]);

  React.useEffect(() => {
    updateShader((mount) => mount.setFrame(frame));
  }, [frame, updateShader]);

  return (
    <div
      data-slot="hero-dither-shader"
      ref={elementRef}
      style={{
        display: "block",
        height: "100%",
        inset: 0,
        position: "absolute",
        width: "100%",
      }}
    />
  );
}

const MemoizedDithering = React.memo(SafeDithering);

interface Dimensions {
  height: number;
  width: number;
}

const EMPTY_DIMENSIONS: Dimensions = { height: 0, width: 0 };
const DEFAULT_MAX_PIXEL_RATIO = 1.5;
const DEFAULT_MAX_PIXEL_COUNT = 1_000_000;
const NEAR_VIEWPORT_MARGIN = "240px 0px";
const DITHER_FADE =
  "radial-gradient(ellipse at center, black 0%, rgba(0,0,0,0.82) 42%, transparent 78%)";
const DITHER_FADE_STYLE: React.CSSProperties = {
  maskImage: DITHER_FADE,
  WebkitMaskImage: DITHER_FADE,
};
// A successful probe is stable for a document. Failed probes are deliberately
// retried: browser context pressure can be transient, and a null context does
// not allocate a resource that needs to be shared or released.
const WEBGL2_DOCUMENTS = new WeakSet<Document>();

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function measure(element: HTMLDivElement): Dimensions {
  const bounds = element.getBoundingClientRect();
  return {
    height: Math.max(0, Math.round(bounds.height)),
    width: Math.max(0, Math.round(bounds.width)),
  };
}

function useDimensions(ref: React.RefObject<HTMLDivElement | null>) {
  const [dimensions, setDimensions] = React.useState(EMPTY_DIMENSIONS);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = (next: Dimensions) => {
      setDimensions((current) =>
        current.height === next.height && current.width === next.width
          ? current
          : next,
      );
    };

    update(measure(element));

    if (typeof ResizeObserver === "undefined") {
      const onResize = () => update(measure(element));
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      update({
        height: Math.max(0, Math.round(entry.contentRect.height)),
        width: Math.max(0, Math.round(entry.contentRect.width)),
      });
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return dimensions;
}

function useNearViewport(ref: React.RefObject<HTMLDivElement | null>) {
  const [isNearViewport, setIsNearViewport] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsNearViewport(entry?.isIntersecting === true),
      { rootMargin: NEAR_VIEWPORT_MARGIN },
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return isNearViewport;
}

function usePrefersReducedMotion() {
  const getPreference = () =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;
  const [reducedMotion, setReducedMotion] = React.useState(getPreference);

  React.useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  return reducedMotion;
}

function supportsWebGL2(ownerDocument: Document): boolean {
  if (WEBGL2_DOCUMENTS.has(ownerDocument)) return true;

  try {
    const canvas = ownerDocument.createElement("canvas");
    const context = canvas.getContext("webgl2");
    if (!context) return false;

    WEBGL2_DOCUMENTS.add(ownerDocument);
    // The probe must not consume one of the browser's limited live contexts.
    // `WEBGL_lose_context` is optional; caching the positive result still caps
    // extension-less browsers at one short-lived probe context per document.
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function supportsShaderRuntime(): boolean {
  // ShaderMount 0.0.77 references this global without a typeof guard after
  // allocating its ResizeObserver. Fail closed before construction so older
  // browsers cannot leave a partially initialized observer behind.
  return (
    typeof ResizeObserver !== "undefined" &&
    typeof requestAnimationFrame === "function" &&
    typeof cancelAnimationFrame === "function" &&
    typeof visualViewport !== "undefined" &&
    (visualViewport === null ||
      (typeof visualViewport.addEventListener === "function" &&
        typeof visualViewport.removeEventListener === "function"))
  );
}

function safePositive(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/**
 * One measured, viewport-aware Paper Dithering canvas with a static fallback.
 * Offscreen instances unmount their canvas so media grids do not retain a
 * WebGL context per card.
 */
export function HeroDither({
  className,
  fade = false,
  fallbackClassName,
  frame = 0,
  maxPixelCount = DEFAULT_MAX_PIXEL_COUNT,
  maxPixelRatio = DEFAULT_MAX_PIXEL_RATIO,
  shape = "swirl",
  size = 2,
  speed = 0.35,
  style,
  type = "4x4",
  ...props
}: HeroDitherProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dimensions = useDimensions(containerRef);
  const isNearViewport = useNearViewport(containerRef);
  const reducedMotion = usePrefersReducedMotion();
  const [webGLSupported, setWebGLSupported] = React.useState<boolean | null>(
    null,
  );
  const [shaderFailed, setShaderFailed] = React.useState(false);
  const handleShaderFailure = React.useCallback(() => {
    setShaderFailed(true);
  }, []);

  React.useEffect(() => {
    const element = containerRef.current;
    // Paper Shaders 0.0.77 creates its own ResizeObserver unconditionally.
    // Do not mount it in older browsers unless the application supplies one.
    if (
      element &&
      isNearViewport &&
      webGLSupported === null &&
      supportsShaderRuntime()
    ) {
      setWebGLSupported(supportsWebGL2(element.ownerDocument));
    }
  }, [isNearViewport, webGLSupported]);

  React.useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const handleContextLoss = (event: Event) => {
      event.preventDefault();
      setShaderFailed(true);
    };
    element.addEventListener(
      "webglcontextcreationerror",
      handleContextLoss,
      true,
    );
    element.addEventListener("webglcontextlost", handleContextLoss, true);
    return () => {
      element.removeEventListener(
        "webglcontextcreationerror",
        handleContextLoss,
        true,
      );
      element.removeEventListener("webglcontextlost", handleContextLoss, true);
    };
  }, []);

  const cssPixelCount = Math.max(1, dimensions.width * dimensions.height);
  const ratioLimit = safePositive(maxPixelRatio, DEFAULT_MAX_PIXEL_RATIO);
  const absoluteBudget = safePositive(maxPixelCount, DEFAULT_MAX_PIXEL_COUNT);
  const ratioBudget = Math.ceil(cssPixelCount * ratioLimit * ratioLimit);
  const pixelBudget = Math.max(1, Math.floor(Math.min(absoluteBudget, ratioBudget)));
  const budgetRatio = Math.sqrt(pixelBudget / cssPixelCount);
  const deviceRatio =
    typeof window === "undefined" ? 1 : safePositive(window.devicePixelRatio, 1);
  const renderRatio = Math.max(
    0.5,
    Math.min(ratioLimit, budgetRatio, deviceRatio),
  );

  const fallback = (
    <div
      className={classes(
        "hero-dither__fallback absolute inset-0 bg-black",
        fallbackClassName,
      )}
      data-slot="hero-dither-fallback"
      style={fade ? undefined : DITHER_FADE_STYLE}
    />
  );

  const canMountShader =
    isNearViewport &&
    supportsShaderRuntime() &&
    webGLSupported === true &&
    !shaderFailed &&
    dimensions.height > 0 &&
    dimensions.width > 0;

  return (
    <div
      {...props}
      aria-hidden="true"
      className={classes(
        "pointer-events-none relative aspect-video h-full w-full overflow-hidden",
        className,
      )}
      data-slot="hero-dither"
      ref={containerRef}
      style={fade ? { ...DITHER_FADE_STYLE, ...style } : style}
    >
      {fallback}
      {canMountShader ? (
        <ShaderBoundary fallback={null} onError={handleShaderFailure}>
          <MemoizedDithering
            frame={frame}
            maxPixelCount={pixelBudget}
            minPixelRatio={renderRatio}
            onError={handleShaderFailure}
            shape={shape}
            size={size}
            speed={reducedMotion ? 0 : speed}
            type={type}
          />
        </ShaderBoundary>
      ) : null}
    </div>
  );
}

export default HeroDither;
