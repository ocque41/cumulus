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

const shaderMountMock = vi.hoisted(() => ({
  construct: vi.fn(),
  dispose: vi.fn(),
  publishBeforeThrow: false,
  setFrame: vi.fn(),
  setMaxPixelCount: vi.fn(),
  setMinPixelRatio: vi.fn(),
  setSpeed: vi.fn(),
  setUniforms: vi.fn(),
  throwOnConstruct: false,
  throwOnSetSpeed: false,
}));

vi.mock("@paper-design/shaders", () => ({
  defaultPatternSizing: {
    fit: "none",
    offsetX: 0,
    offsetY: 0,
    originX: 0.5,
    originY: 0.5,
    rotation: 0,
    scale: 1,
    worldHeight: 0,
    worldWidth: 0,
  },
  ditheringFragmentShader: "dithering-fragment-shader",
  DitheringShapes: {
    dots: 3,
    ripple: 5,
    simplex: 1,
    sphere: 7,
    swirl: 6,
    warp: 2,
    wave: 4,
  },
  DitheringTypes: { "2x2": 2, "4x4": 3, "8x8": 4, random: 1 },
  getShaderColorFromString: (color: string) =>
    color === "#5f5f5f" ? [95 / 255, 95 / 255, 95 / 255, 1] : [0, 0, 0, 1],
  ShaderFitOptions: { contain: 1, cover: 2, none: 0 },
  ShaderMount: class ShaderMountMock {
    private readonly canvas: HTMLCanvasElement;
    private readonly parent: HTMLElement & { paperShaderMount?: unknown };

    constructor(parent: HTMLElement, ...args: unknown[]) {
      this.parent = parent;
      this.canvas = parent.ownerDocument.createElement("canvas");
      parent.prepend(this.canvas);
      shaderMountMock.construct(parent, ...args);

      if (shaderMountMock.publishBeforeThrow) {
        this.parent.paperShaderMount = this;
      }
      if (shaderMountMock.throwOnConstruct) {
        throw new Error("shader constructor failed");
      }

      this.parent.paperShaderMount = this;
      this.parent.setAttribute("data-paper-shader", "");
    }

    dispose = () => {
      shaderMountMock.dispose();
      this.canvas.remove();
      this.parent.removeAttribute("data-paper-shader");
      delete this.parent.paperShaderMount;
    };

    setFrame = shaderMountMock.setFrame;
    setMaxPixelCount = shaderMountMock.setMaxPixelCount;
    setMinPixelRatio = shaderMountMock.setMinPixelRatio;
    setSpeed = (speed: number) => {
      shaderMountMock.setSpeed(speed);
      if (shaderMountMock.throwOnSetSpeed) {
        throw new Error("shader speed update failed");
      }
    };
    setUniforms = shaderMountMock.setUniforms;
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
  shaderMountMock.publishBeforeThrow = false;
  shaderMountMock.throwOnConstruct = false;
  shaderMountMock.throwOnSetSpeed = false;
  shaderMountMock.construct.mockClear();
  shaderMountMock.dispose.mockClear();
  shaderMountMock.setFrame.mockClear();
  shaderMountMock.setMaxPixelCount.mockClear();
  shaderMountMock.setMinPixelRatio.mockClear();
  shaderMountMock.setSpeed.mockClear();
  shaderMountMock.setUniforms.mockClear();
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
    expect(
      container.querySelector("[data-slot='hero-dither-shader']"),
    ).not.toBeInTheDocument();
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
    expect(
      container.querySelector("[data-slot='hero-dither-shader']"),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector("[data-slot='hero-dither-fallback']"),
    ).toBeInTheDocument();
  });

  it("stays static before probing when Paper's visual viewport global is unavailable", () => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("visualViewport", undefined);
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext");

    const { container } = render(<HeroDither />);
    act(() => intersectionObservers[0]?.trigger(true));

    expect(getContext).not.toHaveBeenCalled();
    expect(shaderMountMock.construct).not.toHaveBeenCalled();
    expect(
      container.querySelector("[data-slot='hero-dither-shader']"),
    ).not.toBeInTheDocument();
  });

  it("keeps the static fallback when a nearby card cannot create WebGL2", async () => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("visualViewport", null);
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(null);

    const { container } = render(<HeroDither />);

    act(() => intersectionObservers[0]?.trigger(true));

    await waitFor(() => expect(getContext).toHaveBeenCalledWith("webgl2"));
    expect(
      container.querySelector("[data-slot='hero-dither-shader']"),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector("[data-slot='hero-dither-fallback']"),
    ).toBeInTheDocument();
  });

  it("shares a bounded probe, reacts to motion changes, and cleans up", async () => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("visualViewport", null);
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

    const { container, rerender, unmount } = render(
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

    await waitFor(() => expect(shaderMountMock.construct).toHaveBeenCalledOnce());
    const [host, fragmentShader, uniforms, attributes, constructorSpeed, frame, minRatio, maxPixels] =
      shaderMountMock.construct.mock.calls[0] ?? [];
    expect(host).toHaveAttribute("data-slot", "hero-dither-shader");
    expect(fragmentShader).toBe("dithering-fragment-shader");
    expect(uniforms).toEqual({
      u_colorBack: [0, 0, 0, 1],
      u_colorFront: [95 / 255, 95 / 255, 95 / 255, 1],
      u_fit: 2,
      u_offsetX: 0,
      u_offsetY: 0,
      u_originX: 0.5,
      u_originY: 0.5,
      u_pxSize: 3,
      u_rotation: 0,
      u_scale: 0.62,
      u_shape: 3,
      u_type: 4,
      u_worldHeight: 0,
      u_worldWidth: 0,
    });
    expect(attributes).toBeUndefined();
    expect(constructorSpeed).toBe(0);
    expect(frame).toBe(42);
    expect(minRatio).toBeCloseTo(Math.sqrt(300_000 / (640 * 320)));
    expect(maxPixels).toBe(300_000);
    expect(shaderMountMock.setSpeed).toHaveBeenCalledWith(0);
    expect(getContext).toHaveBeenCalledOnce();
    expect(getContext).toHaveBeenCalledWith("webgl2");
    expect(
      container.querySelector("[data-slot='hero-dither-fallback']"),
    ).toBeInTheDocument();

    act(() => intersectionObservers[1]?.trigger(true));
    await waitFor(() => expect(shaderMountMock.construct).toHaveBeenCalledTimes(2));
    expect(getContext).toHaveBeenCalledOnce();

    reducedMotion = false;
    act(() => motionListeners.forEach((notify) => notify()));
    await waitFor(() => expect(shaderMountMock.setSpeed).toHaveBeenCalledWith(2));
    expect(shaderMountMock.construct).toHaveBeenCalledTimes(2);

    act(() => resizeObservers[0]?.trigger(100, 100));
    await waitFor(() => {
      expect(shaderMountMock.setMaxPixelCount).toHaveBeenCalledWith(40_000);
      expect(shaderMountMock.setMinPixelRatio).toHaveBeenCalledWith(2);
    });
    expect(shaderMountMock.construct).toHaveBeenCalledTimes(2);

    rerender(
      <>
        <HeroDither
          frame={43}
          maxPixelCount={300_000}
          maxPixelRatio={2}
          shape="sphere"
          size={4}
          speed={2}
          type="2x2"
        />
        <HeroDither frame={7} shape="wave" speed={1} />
      </>,
    );
    await waitFor(() => {
      expect(shaderMountMock.setFrame).toHaveBeenCalledWith(43);
      expect(shaderMountMock.setUniforms).toHaveBeenCalledWith(
        expect.objectContaining({ u_pxSize: 4, u_shape: 7, u_type: 2 }),
      );
    });
    expect(shaderMountMock.construct).toHaveBeenCalledTimes(2);

    act(() => intersectionObservers[0]?.trigger(false));

    await waitFor(() =>
      expect(
        container.querySelectorAll("[data-slot='hero-dither-shader']"),
      ).toHaveLength(1),
    );
    expect(shaderMountMock.dispose).toHaveBeenCalledOnce();
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
    expect(shaderMountMock.dispose).toHaveBeenCalledTimes(2);
  });

  it("catches an early constructor failure and removes its partial canvas", async () => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("visualViewport", null);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      getExtension: () => null,
    } as unknown as WebGL2RenderingContext);
    shaderMountMock.throwOnConstruct = true;

    const { container } = render(<HeroDither />);
    act(() => intersectionObservers[0]?.trigger(true));

    await waitFor(() => expect(shaderMountMock.construct).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(
        container.querySelector("[data-slot='hero-dither-shader']"),
      ).not.toBeInTheDocument(),
    );
    expect(container.querySelector("canvas")).not.toBeInTheDocument();
    expect(shaderMountMock.dispose).not.toHaveBeenCalled();
    expect(
      container.querySelector("[data-slot='hero-dither-fallback']"),
    ).toBeInTheDocument();

    act(() => {
      intersectionObservers[0]?.trigger(false);
      intersectionObservers[0]?.trigger(true);
    });
    expect(shaderMountMock.construct).toHaveBeenCalledOnce();
  });

  it("disposes a constructor that publishes itself before throwing", async () => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("visualViewport", null);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      getExtension: () => null,
    } as unknown as WebGL2RenderingContext);
    shaderMountMock.publishBeforeThrow = true;
    shaderMountMock.throwOnConstruct = true;

    const { container } = render(<HeroDither />);
    act(() => intersectionObservers[0]?.trigger(true));

    await waitFor(() => expect(shaderMountMock.dispose).toHaveBeenCalledOnce());
    expect(container.querySelector("canvas")).not.toBeInTheDocument();
    expect(
      container.querySelector("[data-slot='hero-dither-shader']"),
    ).not.toBeInTheDocument();
  });

  it("disposes and falls back when a synchronous shader update throws", async () => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("visualViewport", null);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      getExtension: () => null,
    } as unknown as WebGL2RenderingContext);

    const { container, rerender } = render(<HeroDither speed={1} />);
    act(() => intersectionObservers[0]?.trigger(true));
    await waitFor(() => expect(shaderMountMock.construct).toHaveBeenCalledOnce());

    shaderMountMock.throwOnSetSpeed = true;
    rerender(<HeroDither speed={2} />);

    await waitFor(() => expect(shaderMountMock.dispose).toHaveBeenCalledOnce());
    expect(shaderMountMock.construct).toHaveBeenCalledOnce();
    expect(
      container.querySelector("[data-slot='hero-dither-shader']"),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector("[data-slot='hero-dither-fallback']"),
    ).toBeInTheDocument();
  });

  it("prevents WebGL context loss and disposes the failed shader", async () => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("visualViewport", null);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      getExtension: () => null,
    } as unknown as WebGL2RenderingContext);

    const { container } = render(<HeroDither />);
    act(() => intersectionObservers[0]?.trigger(true));
    await waitFor(() => expect(shaderMountMock.construct).toHaveBeenCalledOnce());

    const canvas = container.querySelector<HTMLCanvasElement>(
      "[data-slot='hero-dither-shader'] canvas",
    );
    const contextLoss = new Event("webglcontextlost", {
      bubbles: true,
      cancelable: true,
    });
    act(() => canvas?.dispatchEvent(contextLoss));

    expect(contextLoss.defaultPrevented).toBe(true);
    await waitFor(() => expect(shaderMountMock.dispose).toHaveBeenCalledOnce());
    expect(
      container.querySelector("[data-slot='hero-dither-shader']"),
    ).not.toBeInTheDocument();
  });
});
