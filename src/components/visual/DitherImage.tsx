"use client";

/**
 * Faithful Vite/native-`img` derivative of Cult UI's Dither Image compound
 * component (MIT): https://www.cult-ui.com/docs/components/dither-image
 *
 * The Bayer effect is supplied by `dither-plugin` (MIT):
 * https://github.com/flornkm/dither-plugin
 * Keep captions and controls outside `DitherImageFrame`: its filter applies to
 * every descendant, while the plugin paints its matrix through `::after`.
 */
import {
  createContext,
  forwardRef,
  useContext,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type HTMLAttributes,
} from "react";

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

/** Cell size mapped to `dither-plugin`'s Tailwind utilities. */
export type DitherSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const DITHER_SIZE_CLASS: Record<DitherSize, string> = {
  xs: "dither-xs",
  sm: "dither-sm",
  md: "dither-md",
  lg: "dither-lg",
  xl: "dither-xl",
  "2xl": "dither-2xl",
};

/** Named presets, a numeric ratio, or any valid CSS `aspect-ratio` string. */
export type DitherAspectRatio = string | number;

/** Typed custom properties consumed by `dither-plugin`. */
export interface DitherCSSVariables {
  "--dither-gray"?: number | string;
  "--dither-contrast"?: number | string;
  "--dither-bright"?: number | string;
  "--dither-blur"?: string;
  "--dither-cell"?: string;
  "--dither-opacity"?: number | string;
  "--dither-image"?: string;
}

export type DitherFrameStyle = CSSProperties & DitherCSSVariables;

function resolveAspectRatio(ratio: DitherAspectRatio): string {
  if (typeof ratio === "number") {
    return String(ratio);
  }

  const presets: Record<string, string> = {
    square: "1 / 1",
    video: "16 / 9",
    portrait: "3 / 4",
    wide: "21 / 9",
  };

  return presets[ratio] ?? ratio;
}

const DitherImageFrameContext = createContext<{ invertOnDark: boolean } | null>(
  null,
);

export type DitherImageProps = ComponentPropsWithoutRef<"figure">;

/** Figure wrapper kept outside the dither filter so its caption stays crisp. */
export const DitherImage = forwardRef<HTMLElement, DitherImageProps>(
  function DitherImage({ className, ...props }, ref) {
    return (
      <figure
        className={classes("inline-flex flex-col gap-3", className)}
        data-slot="dither-image"
        ref={ref}
        {...props}
      />
    );
  },
);

export interface DitherImageFrameProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "style"> {
  size?: DitherSize;
  aspectRatio?: DitherAspectRatio;
  /** `0` keeps color; `1` is fully grayscale. */
  grayscale?: number;
  /** Unitless CSS `contrast()` value; the plugin's high default crushes tones. */
  contrast?: number;
  /** Unitless CSS `brightness()` value. */
  brightness?: number;
  /** Blur radius in pixels, or a complete CSS length. */
  blur?: number | string;
  /** Dot-pattern overlay opacity from `0` through `1`. */
  opacity?: number;
  /** `true` uses `rounded-xl`; a string supplies a project class. */
  rounded?: boolean | string;
  /** Invert the matrix in dark mode while counter-inverting the image. */
  invertOnDark?: boolean;
  /** Explicit style values override values generated from the typed props. */
  style?: DitherFrameStyle;
}

/** The filtered surface that owns the plugin's pseudo-element. */
export const DitherImageFrame = forwardRef<
  HTMLDivElement,
  DitherImageFrameProps
>(function DitherImageFrame(
  {
    aspectRatio,
    blur,
    brightness,
    className,
    contrast,
    grayscale,
    invertOnDark = false,
    opacity,
    rounded = true,
    size = "lg",
    style,
    ...props
  },
  ref,
) {
  const generatedStyle: DitherFrameStyle = {};

  if (grayscale !== undefined) generatedStyle["--dither-gray"] = grayscale;
  if (contrast !== undefined) generatedStyle["--dither-contrast"] = contrast;
  if (brightness !== undefined) generatedStyle["--dither-bright"] = brightness;
  if (blur !== undefined) {
    generatedStyle["--dither-blur"] =
      typeof blur === "number" ? `${blur}px` : blur;
  }
  if (opacity !== undefined) generatedStyle["--dither-opacity"] = opacity;
  if (aspectRatio !== undefined) {
    generatedStyle.aspectRatio = resolveAspectRatio(aspectRatio);
  }

  const roundedClass =
    rounded === true ? "rounded-xl" : typeof rounded === "string" ? rounded : undefined;

  const frame = (
    <div
      className={classes(
        DITHER_SIZE_CLASS[size],
        "relative block w-full",
        roundedClass,
        className,
      )}
      data-size={size}
      data-slot="dither-image-frame"
      ref={ref}
      style={{ ...generatedStyle, ...style }}
      {...props}
    />
  );

  return (
    <DitherImageFrameContext.Provider value={{ invertOnDark }}>
      {invertOnDark ? <div className="w-full dark:invert">{frame}</div> : frame}
    </DitherImageFrameContext.Provider>
  );
});

export type DitherRevealSize = CSSProperties["width"];

export interface DitherImageRevealProps
  extends Omit<ComponentPropsWithoutRef<"div">, "style"> {
  /** Square stage size as a CSS length; numbers use CSS-pixel semantics. */
  size?: DitherRevealSize;
  style?: CSSProperties;
}

/** Relative stage for a dithered frame plus a masked clean-image overlay. */
export const DitherImageReveal = forwardRef<
  HTMLDivElement,
  DitherImageRevealProps
>(function DitherImageReveal({ className, size, style, ...props }, ref) {
  const sizedStyle: CSSProperties =
    size === undefined ? {} : { height: size, width: size };

  return (
    <div
      className={classes("relative overflow-hidden", className)}
      data-slot="dither-image-reveal"
      ref={ref}
      style={{ ...sizedStyle, ...style }}
      {...props}
    />
  );
});

export type DitherRevealDirection =
  | "l"
  | "r"
  | "t"
  | "b"
  | "tl-br"
  | "tr-bl"
  | "bl-tr"
  | "br-tl"
  | "radial";

type NativeImageSource =
  | { src: string; srcSet?: string }
  | { src?: string; srcSet: string };

type NativeImageBaseProps = Omit<
  ComponentPropsWithoutRef<"img">,
  "ref" | "src" | "srcSet"
>;

export type DitherImageOverlayProps = Omit<
  NativeImageBaseProps,
  "alt" | "aria-hidden" | "style"
> &
  NativeImageSource & {
  /** The overlay duplicates the source image and must remain decorative. */
  alt?: "";
  direction?: DitherRevealDirection;
  from?: number;
  to?: number;
  /** Replaces the generated mask with project/Tailwind mask utilities. */
  maskClassName?: string;
  /** Compatibility with the source `next/image` API; defaults to `true`. */
  fill?: boolean;
  style?: CSSProperties;
};

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

function revealMaskImage(
  direction: DitherRevealDirection,
  from: number,
  to: number,
): string {
  const a = Math.min(clampPercent(from), clampPercent(to));
  const b = Math.max(clampPercent(from), clampPercent(to));

  switch (direction) {
    case "r":
      return `linear-gradient(to right, black ${a}%, transparent ${b}%)`;
    case "l":
      return `linear-gradient(to left, black ${a}%, transparent ${b}%)`;
    case "t":
      return `linear-gradient(to bottom, black ${a}%, transparent ${b}%)`;
    case "b":
      return `linear-gradient(to top, black ${a}%, transparent ${b}%)`;
    case "tl-br":
      return `linear-gradient(to bottom right, black ${a}%, transparent ${b}%)`;
    case "tr-bl":
      return `linear-gradient(to bottom left, black ${a}%, transparent ${b}%)`;
    case "bl-tr":
      return `linear-gradient(to top right, black ${a}%, transparent ${b}%)`;
    case "br-tl":
      return `linear-gradient(to top left, black ${a}%, transparent ${b}%)`;
    case "radial":
      return `radial-gradient(circle at center, black ${a}%, transparent ${b}%)`;
  }
}

function revealMaskStyle(
  direction: DitherRevealDirection,
  from: number,
  to: number,
): CSSProperties {
  const maskImage = revealMaskImage(direction, from, to);

  return {
    maskImage,
    maskRepeat: "no-repeat",
    maskSize: "100% 100%",
    WebkitMaskImage: maskImage,
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskSize: "100% 100%",
  };
}

/** Clean duplicate revealed over the dithered image by a typed CSS mask. */
export const DitherImageOverlay = forwardRef<
  HTMLImageElement,
  DitherImageOverlayProps
>(function DitherImageOverlay(
  {
    alt = "",
    className,
    decoding = "async",
    direction = "r",
    fill = true,
    from = 0,
    maskClassName,
    style,
    to = 65,
    ...props
  },
  ref,
) {
  const maskStyle =
    maskClassName === undefined ? revealMaskStyle(direction, from, to) : {};

  return (
    <img
      {...props}
      alt={alt}
      aria-hidden="true"
      className={classes(
        "pointer-events-none h-full w-full object-cover",
        fill && "absolute inset-0",
        maskClassName,
        className,
      )}
      data-slot="dither-image-overlay"
      decoding={decoding}
      ref={ref}
      style={{ ...maskStyle, ...style }}
    />
  );
});

export type DitherImageContentProps = Omit<NativeImageBaseProps, "alt"> &
  NativeImageSource & {
    /** Alternative text is required for the meaningful source image. */
    alt: string;
    /** Compatibility with the source `next/image` API. */
    fill?: boolean;
  };

/** Responsive native image tuned for placement inside `DitherImageFrame`. */
export const DitherImageContent = forwardRef<
  HTMLImageElement,
  DitherImageContentProps
>(function DitherImageContent(
  { alt, className, decoding = "async", fill = false, ...props },
  ref,
) {
  const context = useContext(DitherImageFrameContext);

  return (
    <img
      alt={alt}
      className={classes(
        "block h-full w-full object-cover",
        fill && "absolute inset-0",
        context?.invertOnDark === true && "dark:invert",
        className,
      )}
      data-slot="dither-image-content"
      decoding={decoding}
      ref={ref}
      {...props}
    />
  );
});

export type DitherImageCaptionProps = ComponentPropsWithoutRef<"figcaption">;

/** Caption sibling kept outside the filtered surface. */
export const DitherImageCaption = forwardRef<
  HTMLElement,
  DitherImageCaptionProps
>(function DitherImageCaption({ className, ...props }, ref) {
  return (
    <figcaption
      className={classes(
        "text-pretty text-sm leading-relaxed text-muted-foreground",
        className,
      )}
      data-slot="dither-image-caption"
      ref={ref}
      {...props}
    />
  );
});

DitherImage.displayName = "DitherImage";
DitherImageFrame.displayName = "DitherImageFrame";
DitherImageReveal.displayName = "DitherImageReveal";
DitherImageOverlay.displayName = "DitherImageOverlay";
DitherImageContent.displayName = "DitherImageContent";
DitherImageCaption.displayName = "DitherImageCaption";
