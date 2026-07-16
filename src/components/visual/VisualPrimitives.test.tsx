import * as React from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import {
  DitherImage,
  DitherImageCaption,
  DitherImageContent,
  DitherImageFrame,
  DitherImageOverlay,
  DitherImageReveal,
  type DitherImageContentProps,
  type DitherImageOverlayProps,
} from "./DitherImage";
import { EdgeBlur } from "./EdgeBlur";
import { HeroDither } from "./HeroDither";

const shaderCleanup = vi.hoisted(() => vi.fn());

vi.mock("@paper-design/shaders-react", () => ({
  Dithering: (props: Record<string, unknown>) => {
    React.useEffect(() => shaderCleanup, []);

    return (
      <div
        data-frame={String(props.frame)}
        data-color-back={String(props.colorBack)}
        data-color-front={String(props.colorFront)}
        data-height={String(props.height)}
        data-max-pixel-count={String(props.maxPixelCount)}
        data-min-pixel-ratio={String(props.minPixelRatio)}
        data-shape={String(props.shape)}
        data-size={String(props.size)}
        data-speed={String(props.speed)}
        data-testid="paper-dithering"
        data-type={String(props.type)}
        data-width={String(props.width)}
      />
    );
  },
}));

const intersectionObservers: IntersectionObserverMock[] = [];
const resizeObservers: ResizeObserverMock[] = [];

class IntersectionObserverMock {
  private callback: IntersectionObserverCallback;
  private target: Element | null = null;
  readonly disconnect = vi.fn(() => {
    this.target = null;
  });

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    intersectionObservers.push(this);
  }

  observe(target: Element) {
    this.target = target;
  }

  trigger(isIntersecting: boolean) {
    if (!this.target) return;
    this.callback(
      [
        {
          isIntersecting,
          target: this.target,
        } as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver,
    );
  }

  unobserve() {
    this.target = null;
  }
}

class ResizeObserverMock {
  private callback: ResizeObserverCallback;
  private target: Element | null = null;
  readonly disconnect = vi.fn(() => {
    this.target = null;
  });

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    resizeObservers.push(this);
  }

  observe(target: Element) {
    this.target = target;
    this.trigger(640, 320);
  }

  trigger(width: number, height: number) {
    if (!this.target) return;
    this.callback(
      [
        {
          contentRect: { height, width },
          target: this.target,
        } as ResizeObserverEntry,
      ],
      this as unknown as ResizeObserver,
    );
  }

  unobserve() {}
}

afterEach(() => {
  cleanup();
  intersectionObservers.length = 0;
  resizeObservers.length = 0;
  shaderCleanup.mockClear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("EdgeBlur", () => {
  it("renders the five masked Cult blur layers without exposing content", () => {
    vi.stubGlobal("CSS", { supports: vi.fn(() => true) });

    const { container } = render(<EdgeBlur height={90} position="top" />);
    const root = container.querySelector<HTMLElement>("[data-slot='edge-blur']");

    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).toHaveAttribute("data-position", "top");
    expect(root).toHaveStyle({ height: "90px" });
    expect(root?.querySelectorAll("[data-blur]")).toHaveLength(5);
    expect(
      Array.from(root?.querySelectorAll<HTMLElement>("[data-blur]") ?? []).map(
        (layer) => layer.dataset.blur,
      ),
    ).toEqual(["1", "2", "3", "6", "12"]);
    expect(root?.querySelector<HTMLElement>("[data-blur='12']")?.style.maskImage).toBe(
      "linear-gradient(to bottom, black, transparent)",
    );
  });

  it("degrades to no decoration when either CSS effect is unsupported", () => {
    vi.stubGlobal("CSS", { supports: vi.fn(() => false) });

    const { container } = render(<EdgeBlur />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe("DitherImage", () => {
  it("requires src or srcSet for both native image layers", () => {
    expectTypeOf<{ alt: string }>().not.toMatchTypeOf<DitherImageContentProps>();
    expectTypeOf<{ alt: "" }>().not.toMatchTypeOf<DitherImageOverlayProps>();
    expectTypeOf<{ alt: string; src: string }>().toMatchTypeOf<DitherImageContentProps>();
    expectTypeOf<{ alt: ""; srcSet: string }>().toMatchTypeOf<DitherImageOverlayProps>();
  });

  it("keeps meaningful image text and captions outside the filtered surface", () => {
    const { container } = render(
      <DitherImage>
        <DitherImageFrame
          aspectRatio="video"
          blur={1.5}
          grayscale={0}
          opacity={0.7}
          size="sm"
        >
          <DitherImageContent alt="A cloud study" fill src="/cloud.jpg" />
        </DitherImageFrame>
        <DitherImageCaption>Cloud study, dithered.</DitherImageCaption>
      </DitherImage>,
    );

    const frame = container.querySelector<HTMLElement>(
      "[data-slot='dither-image-frame']",
    );
    const caption = screen.getByText("Cloud study, dithered.");

    expect(screen.getByRole("img", { name: "A cloud study" })).toHaveClass(
      "absolute",
      "object-cover",
    );
    expect(frame).toHaveClass("dither-sm");
    expect(frame?.style.aspectRatio).toBe("16 / 9");
    expect(frame?.style.getPropertyValue("--dither-gray")).toBe("0");
    expect(frame?.style.getPropertyValue("--dither-blur")).toBe("1.5px");
    expect(frame?.style.getPropertyValue("--dither-opacity")).toBe("0.7");
    expect(frame).not.toContainElement(caption);
  });

  it("builds a native-image reveal with a typed radial mask", () => {
    const { container } = render(
      <DitherImageReveal size={320}>
        <DitherImageOverlay
          alt=""
          direction="radial"
          from={25}
          src="/cloud.jpg"
          to={75}
        />
      </DitherImageReveal>,
    );

    const stage = container.querySelector<HTMLElement>(
      "[data-slot='dither-image-reveal']",
    );
    const overlay = container.querySelector<HTMLImageElement>(
      "[data-slot='dither-image-overlay']",
    );

    expect(stage).toHaveStyle({ height: "320px", width: "320px" });
    expect(overlay?.style.maskImage).toBe(
      "radial-gradient(circle at center, black 25%, transparent 75%)",
    );
    expect(overlay).toHaveAttribute("alt", "");
    expect(overlay).toHaveAttribute("aria-hidden", "true");
  });
});

describe("HeroDither", () => {
  it("stays static without IntersectionObserver instead of allocating every card", () => {
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext");

    const { container } = render(<HeroDither />);

    expect(getContext).not.toHaveBeenCalled();
    expect(screen.queryByTestId("paper-dithering")).not.toBeInTheDocument();
    expect(
      container.querySelector("[data-slot='hero-dither-fallback']"),
    ).toBeInTheDocument();
  });

  it("stays static when Paper's required ResizeObserver is unavailable", () => {
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
    vi.stubGlobal("ResizeObserver", undefined);
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext");

    const { container } = render(<HeroDither />);
    act(() => intersectionObservers[0]?.trigger(true));

    expect(getContext).not.toHaveBeenCalled();
    expect(screen.queryByTestId("paper-dithering")).not.toBeInTheDocument();
    expect(
      container.querySelector("[data-slot='hero-dither-fallback']"),
    ).toBeInTheDocument();
  });

  it("keeps the static fallback when a nearby card cannot create WebGL2", async () => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(null);

    const { container } = render(<HeroDither />);

    act(() => intersectionObservers[0]?.trigger(true));

    await waitFor(() => expect(getContext).toHaveBeenCalledWith("webgl2"));
    expect(screen.queryByTestId("paper-dithering")).not.toBeInTheDocument();
    expect(
      container.querySelector("[data-slot='hero-dither-fallback']"),
    ).toBeInTheDocument();
  });

  it("shares a bounded probe, reacts to motion changes, and cleans up", async () => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
    vi.stubGlobal("devicePixelRatio", 3);
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation(
        () =>
          ({
            // Exercise the optional-extension branch: the positive support
            // result still has to prevent a probe per card.
            getExtension: () => null,
          }) as unknown as WebGL2RenderingContext,
      );
    let reducedMotion = true;
    const motionListeners: Array<() => void> = [];
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) =>
        ({
          addEventListener: vi.fn((_event, listener: EventListenerOrEventListenerObject) => {
            const notify =
              typeof listener === "function"
                ? () => listener(new Event("change"))
                : () => listener.handleEvent(new Event("change"));
            motionListeners.push(notify);
          }),
          addListener: vi.fn(),
          dispatchEvent: vi.fn(),
          get matches() {
            return query === "(prefers-reduced-motion: reduce)" && reducedMotion;
          },
          media: query,
          onchange: null,
          removeEventListener: vi.fn(),
          removeListener: vi.fn(),
        }) as unknown as MediaQueryList,
    );

    const { container, unmount } = render(
      <>
        <HeroDither
          frame={42}
          maxPixelCount={300_000}
          maxPixelRatio={2}
          shape="dots"
          size={3}
          speed={2}
          type="8x8"
        />
        <HeroDither frame={7} shape="wave" speed={1} />
      </>,
    );

    expect(
      container.querySelector("[data-slot='hero-dither-fallback']"),
    ).toBeInTheDocument();
    expect(intersectionObservers).toHaveLength(2);
    expect(resizeObservers).toHaveLength(2);
    expect(getContext).not.toHaveBeenCalled();

    act(() => intersectionObservers[0]?.trigger(true));

    const shader = await screen.findByTestId("paper-dithering");
    expect(shader).toHaveAttribute("data-shape", "dots");
    expect(shader).toHaveAttribute("data-type", "8x8");
    expect(shader).toHaveAttribute("data-size", "3");
    expect(shader).toHaveAttribute("data-frame", "42");
    expect(shader).toHaveAttribute("data-speed", "0");
    expect(shader).toHaveAttribute("data-color-back", "#000000");
    expect(shader).toHaveAttribute("data-color-front", "#5f5f5f");
    expect(shader).toHaveAttribute("data-width", "640");
    expect(shader).toHaveAttribute("data-height", "320");
    expect(shader).toHaveAttribute("data-max-pixel-count", "300000");
    expect(Number(shader.getAttribute("data-min-pixel-ratio"))).toBeCloseTo(
      Math.sqrt(300_000 / (640 * 320)),
    );
    expect(getContext).toHaveBeenCalledOnce();
    expect(getContext).toHaveBeenCalledWith("webgl2");
    expect(
      container.querySelector("[data-slot='hero-dither-fallback']"),
    ).toBeInTheDocument();

    act(() => intersectionObservers[1]?.trigger(true));
    await waitFor(() =>
      expect(screen.getAllByTestId("paper-dithering")).toHaveLength(2),
    );
    expect(getContext).toHaveBeenCalledOnce();

    reducedMotion = false;
    act(() => motionListeners.forEach((notify) => notify()));
    await waitFor(() =>
      expect(screen.getAllByTestId("paper-dithering")[0]).toHaveAttribute(
        "data-speed",
        "2",
      ),
    );

    act(() => resizeObservers[0]?.trigger(100, 100));
    await waitFor(() => {
      const resizedShader = screen.getAllByTestId("paper-dithering")[0];
      expect(resizedShader).toHaveAttribute("data-width", "100");
      expect(resizedShader).toHaveAttribute("data-height", "100");
      expect(resizedShader).toHaveAttribute("data-max-pixel-count", "40000");
      expect(resizedShader).toHaveAttribute("data-min-pixel-ratio", "2");
    });

    act(() => intersectionObservers[0]?.trigger(false));

    await waitFor(() =>
      expect(screen.getAllByTestId("paper-dithering")).toHaveLength(1),
    );
    expect(shaderCleanup).toHaveBeenCalledOnce();
    expect(
      container.querySelector("[data-slot='hero-dither-fallback']"),
    ).toBeInTheDocument();

    unmount();
    expect(intersectionObservers.every((observer) => observer.disconnect.mock.calls.length === 1)).toBe(
      true,
    );
    expect(resizeObservers.every((observer) => observer.disconnect.mock.calls.length === 1)).toBe(
      true,
    );
    expect(shaderCleanup).toHaveBeenCalledTimes(2);
  });
});
