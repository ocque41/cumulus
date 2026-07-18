import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DITHER_FRAME_INTERVAL_MS,
  DitherArtwork,
  stableDitherSeed,
} from "./DitherArtwork";

interface IntersectionHarness {
  callback: IntersectionObserverCallback;
  disconnect: ReturnType<typeof vi.fn>;
  observe: ReturnType<typeof vi.fn>;
  options?: IntersectionObserverInit;
  targets: Set<Element>;
  unobserve: ReturnType<typeof vi.fn>;
}

interface RuntimeHarness {
  cancelAnimationFrame: ReturnType<typeof vi.fn>;
  frames: Map<number, FrameRequestCallback>;
  motion: {
    removeEventListener: ReturnType<typeof vi.fn>;
    setReduced: (next: boolean) => void;
  };
  requestAnimationFrame: ReturnType<typeof vi.fn>;
  runNextFrame: (timestamp: number) => void;
  setVisibility: (next: DocumentVisibilityState) => void;
}

const observers: IntersectionHarness[] = [];

class IntersectionObserverMock {
  readonly harness: IntersectionHarness;

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    const targets = new Set<Element>();
    this.harness = {
      callback,
      disconnect: vi.fn(() => targets.clear()),
      observe: vi.fn((target: Element) => targets.add(target)),
      options,
      targets,
      unobserve: vi.fn((target: Element) => targets.delete(target)),
    };
    observers.push(this.harness);
  }

  disconnect() {
    this.harness.disconnect();
  }

  observe(target: Element) {
    this.harness.observe(target);
  }

  unobserve(target: Element) {
    this.harness.unobserve(target);
  }
}

function canvasContext(putImageData = vi.fn()) {
  return {
    createImageData: vi.fn((width: number, height: number) => ({
      data: new Uint8ClampedArray(width * height * 4),
      height,
      width,
    })),
    fillRect: vi.fn(),
    fillStyle: "",
    putImageData,
  } as unknown as CanvasRenderingContext2D;
}

function observerEntry(target: Element, isIntersecting: boolean) {
  return { isIntersecting, target } as IntersectionObserverEntry;
}

function triggerIntersections(
  entries: Array<{ isIntersecting: boolean; target: Element }>,
) {
  const observer = observers[0];
  expect(observer).toBeDefined();
  if (!observer) return;
  act(() => {
    observer.callback(
      entries.map(({ isIntersecting, target }) =>
        observerEntry(target, isIntersecting)),
      {} as IntersectionObserver,
    );
  });
}

function installRuntime({ reduced = false } = {}): RuntimeHarness {
  vi.useFakeTimers();
  vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);

  let visibilityState: DocumentVisibilityState = "visible";
  vi.spyOn(document, "visibilityState", "get").mockImplementation(
    () => visibilityState,
  );

  let reducedMotion = reduced;
  const motionListeners = new Set<EventListenerOrEventListenerObject>();
  const removeEventListener = vi.fn(
    (_event: string, listener: EventListenerOrEventListenerObject) => {
      motionListeners.delete(listener);
    },
  );
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query) =>
      ({
        addEventListener: vi.fn(
          (_event: string, listener: EventListenerOrEventListenerObject) => {
            motionListeners.add(listener);
          },
        ),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        get matches() {
          return query === "(prefers-reduced-motion: reduce)" && reducedMotion;
        },
        media: query,
        onchange: null,
        removeEventListener,
        removeListener: vi.fn(),
      }) as unknown as MediaQueryList,
  );

  let frameId = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    frameId += 1;
    frames.set(frameId, callback);
    return frameId;
  });
  const cancelAnimationFrame = vi.fn((id: number) => {
    frames.delete(id);
  });
  vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
  vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);

  return {
    cancelAnimationFrame,
    frames,
    motion: {
      removeEventListener,
      setReduced: (next: boolean) => {
        reducedMotion = next;
        act(() => {
          for (const listener of motionListeners) {
            const event = new Event("change");
            if (typeof listener === "function") listener(event);
            else listener.handleEvent(event);
          }
        });
      },
    },
    requestAnimationFrame,
    runNextFrame: (timestamp: number) => {
      const next = frames.entries().next().value as
        | [number, FrameRequestCallback]
        | undefined;
      expect(next).toBeDefined();
      if (!next) return;
      frames.delete(next[0]);
      act(() => next[1](timestamp));
    },
    setVisibility: (next: DocumentVisibilityState) => {
      visibilityState = next;
      act(() => document.dispatchEvent(new Event("visibilitychange")));
    },
  };
}

function advanceRuntime(milliseconds: number) {
  act(() => vi.advanceTimersByTime(milliseconds));
}

function imageDataSnapshot(putImageData: ReturnType<typeof vi.fn>) {
  const image = putImageData.mock.calls.at(-1)?.[0] as
    | { data: Uint8ClampedArray }
    | undefined;
  expect(image).toBeDefined();
  return Array.from(image?.data ?? []);
}

afterEach(() => {
  cleanup();
  if (vi.isFakeTimers()) {
    vi.clearAllTimers();
    vi.useRealTimers();
  }
  observers.length = 0;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("DitherArtwork", () => {
  it("keeps deterministic semantics and a zero-allocation fallback without an observer", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext");

    const { container } = render(
      <>
        <DitherArtwork label="A project signal field" seed="project:requisia" />
        <DitherArtwork decorative seed="project:requisia" />
        <DitherArtwork decorative seed="project:insuja" />
      </>,
    );

    const artwork = container.querySelectorAll<HTMLElement>(
      "[data-slot='dither-artwork']",
    );
    expect(screen.getByRole("img", { name: "A project signal field" })).toBe(
      artwork[0],
    );
    expect(artwork[1]).toHaveAttribute("aria-hidden", "true");
    expect(artwork[1]).not.toHaveAttribute("role");
    expect(artwork[0]?.dataset.ditherSeed).toBe(artwork[1]?.dataset.ditherSeed);
    expect(artwork[1]?.dataset.ditherSeed).not.toBe(
      artwork[2]?.dataset.ditherSeed,
    );
    expect(artwork[0]).toHaveAttribute("data-motion", "static");
    expect(artwork[0]).not.toHaveAttribute("data-rendered");
    expect(getContext).not.toHaveBeenCalled();
    expect(stableDitherSeed("project:requisia")).toBe(
      stableDitherSeed("project:requisia"),
    );
  });

  it("defers Canvas2D work until intersection and uses one timeout per paint", () => {
    const runtime = installRuntime();
    const putImageData = vi.fn();
    const context = canvasContext(putImageData);
    const fillRect = context.fillRect as ReturnType<typeof vi.fn>;
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(context);
    const { container, unmount } = render(
      <DitherArtwork decorative seed="post:one" />,
    );
    const root = container.querySelector<HTMLElement>(
      "[data-slot='dither-artwork']",
    );
    const canvas = container.querySelector<HTMLCanvasElement>("canvas");
    expect(root).not.toBeNull();
    expect(canvas).not.toBeNull();
    if (!root || !canvas) return;

    expect(observers).toHaveLength(1);
    expect(observers[0]?.options).toMatchObject({ rootMargin: "180px 0px" });
    expect(getContext).not.toHaveBeenCalled();
    expect(putImageData).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(runtime.frames.size).toBe(0);

    triggerIntersections([{ isIntersecting: true, target: root }]);

    expect(getContext).toHaveBeenCalledOnce();
    expect(putImageData).toHaveBeenCalledOnce();
    expect(root).toHaveAttribute("data-rendered", "true");
    expect(root).toHaveAttribute("data-motion", "active");
    expect(vi.getTimerCount()).toBe(1);
    expect(runtime.requestAnimationFrame).not.toHaveBeenCalled();
    const initialFrame = imageDataSnapshot(putImageData);
    const initialAccent = fillRect.mock.calls[0]?.slice(0, 2);

    advanceRuntime(DITHER_FRAME_INTERVAL_MS - 1);
    expect(runtime.requestAnimationFrame).not.toHaveBeenCalled();
    advanceRuntime(1);
    expect(runtime.frames.size).toBe(1);
    expect(vi.getTimerCount()).toBe(0);

    runtime.runNextFrame(DITHER_FRAME_INTERVAL_MS);
    expect(putImageData).toHaveBeenCalledTimes(2);
    expect(imageDataSnapshot(putImageData)).not.toEqual(initialFrame);
    expect(fillRect.mock.calls[2]?.slice(0, 2)).not.toEqual(initialAccent);
    expect(vi.getTimerCount()).toBe(1);
    expect(runtime.frames.size).toBe(0);

    triggerIntersections([{ isIntersecting: false, target: root }]);
    expect(root).toHaveAttribute("data-motion", "static");
    expect(vi.getTimerCount()).toBe(0);
    advanceRuntime(DITHER_FRAME_INTERVAL_MS * 3);
    expect(runtime.requestAnimationFrame).toHaveBeenCalledOnce();

    triggerIntersections([{ isIntersecting: true, target: root }]);
    expect(putImageData).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(1);
    advanceRuntime(DITHER_FRAME_INTERVAL_MS);
    expect(runtime.frames.size).toBe(1);

    const removeCanvasListener = vi.spyOn(canvas, "removeEventListener");
    unmount();

    expect(runtime.frames.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    expect(runtime.cancelAnimationFrame).toHaveBeenCalled();
    expect(observers[0]?.unobserve).toHaveBeenCalledWith(root);
    expect(observers[0]?.disconnect).toHaveBeenCalledOnce();
    expect(runtime.motion.removeEventListener).toHaveBeenCalledOnce();
    expect(removeCanvasListener).toHaveBeenCalledWith(
      "contextlost",
      expect.any(Function),
    );
    expect(removeCanvasListener).toHaveBeenCalledWith(
      "contextrestored",
      expect.any(Function),
    );
  });

  it("keeps one shared schedule and paints only intersecting entries", () => {
    const runtime = installRuntime();
    const putImageData = [vi.fn(), vi.fn()];
    const contexts = putImageData.map((paint) => canvasContext(paint));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation(() => contexts.shift() ?? null);
    const { container } = render(
      <>
        <DitherArtwork decorative seed="post:one" />
        <DitherArtwork decorative seed="post:two" />
      </>,
    );
    const roots = Array.from(
      container.querySelectorAll<HTMLElement>("[data-slot='dither-artwork']"),
    );
    expect(roots).toHaveLength(2);

    triggerIntersections(
      roots.map((target) => ({ isIntersecting: true, target })),
    );
    expect(putImageData.map((paint) => paint.mock.calls.length)).toEqual([1, 1]);
    expect(vi.getTimerCount()).toBe(1);

    advanceRuntime(DITHER_FRAME_INTERVAL_MS);
    runtime.runNextFrame(DITHER_FRAME_INTERVAL_MS);
    expect(putImageData.map((paint) => paint.mock.calls.length)).toEqual([2, 2]);
    expect(vi.getTimerCount()).toBe(1);

    triggerIntersections([{ isIntersecting: false, target: roots[0] as Element }]);
    expect(vi.getTimerCount()).toBe(1);
    advanceRuntime(DITHER_FRAME_INTERVAL_MS);
    runtime.runNextFrame(DITHER_FRAME_INTERVAL_MS * 2);
    expect(putImageData.map((paint) => paint.mock.calls.length)).toEqual([2, 3]);
    expect(vi.getTimerCount()).toBe(1);

    triggerIntersections([{ isIntersecting: false, target: roots[1] as Element }]);
    expect(vi.getTimerCount()).toBe(0);
    expect(runtime.frames.size).toBe(0);

    triggerIntersections([{ isIntersecting: true, target: roots[0] as Element }]);
    expect(putImageData.map((paint) => paint.mock.calls.length)).toEqual([3, 3]);
    expect(vi.getTimerCount()).toBe(1);
  });

  it("renders distinct Bayer fields for distinct variants", () => {
    installRuntime({ reduced: true });
    const putImageData = [vi.fn(), vi.fn()];
    const contexts = putImageData.map((paint) => canvasContext(paint));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation(() => contexts.shift() ?? null);
    const { container } = render(
      <>
        <DitherArtwork decorative seed="same-post" variant="orbit" />
        <DitherArtwork decorative seed="same-post" variant="scan" />
      </>,
    );
    const roots = Array.from(
      container.querySelectorAll<HTMLElement>("[data-slot='dither-artwork']"),
    );

    triggerIntersections(
      roots.map((target) => ({ isIntersecting: true, target })),
    );

    expect(putImageData.map((paint) => paint.mock.calls.length)).toEqual([1, 1]);
    expect(
      imageDataSnapshot(putImageData[0] as ReturnType<typeof vi.fn>),
    ).not.toEqual(
      imageDataSnapshot(putImageData[1] as ReturnType<typeof vi.fn>),
    );
    expect(roots[0]?.dataset.ditherSeed).not.toBe(roots[1]?.dataset.ditherSeed);
  });

  it("pauses and redraws deterministically across visibility and motion changes", () => {
    const runtime = installRuntime();
    const putImageData = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(canvasContext(putImageData));
    const { container } = render(
      <DitherArtwork decorative seed="post:visibility" />,
    );
    const root = container.querySelector<HTMLElement>(
      "[data-slot='dither-artwork']",
    );
    expect(root).not.toBeNull();
    if (!root) return;

    triggerIntersections([{ isIntersecting: true, target: root }]);
    expect(vi.getTimerCount()).toBe(1);
    const initialFrame = imageDataSnapshot(putImageData);

    runtime.setVisibility("hidden");
    expect(root).toHaveAttribute("data-motion", "static");
    expect(putImageData).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
    advanceRuntime(DITHER_FRAME_INTERVAL_MS * 3);
    expect(runtime.frames.size).toBe(0);

    runtime.setVisibility("visible");
    expect(root).toHaveAttribute("data-motion", "active");
    expect(putImageData).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(1);

    runtime.motion.setReduced(true);
    expect(root).toHaveAttribute("data-motion", "static");
    expect(putImageData).toHaveBeenCalledTimes(4);
    const reducedFrame = imageDataSnapshot(putImageData);
    expect(reducedFrame).toEqual(initialFrame);
    expect(vi.getTimerCount()).toBe(0);

    advanceRuntime(DITHER_FRAME_INTERVAL_MS * 3);
    expect(runtime.frames.size).toBe(0);
    runtime.motion.setReduced(false);
    expect(root).toHaveAttribute("data-motion", "active");
    expect(putImageData).toHaveBeenCalledTimes(5);
    expect(vi.getTimerCount()).toBe(1);
  });

  it("reveals the fallback on context loss and restores a reduced-motion frame", () => {
    const runtime = installRuntime({ reduced: true });
    const putImageData = vi.fn();
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(canvasContext(putImageData));
    const { container } = render(
      <DitherArtwork decorative seed="post:context" />,
    );
    const root = container.querySelector<HTMLElement>(
      "[data-slot='dither-artwork']",
    );
    const canvas = container.querySelector<HTMLCanvasElement>("canvas");
    expect(root).not.toBeNull();
    expect(canvas).not.toBeNull();
    if (!root || !canvas) return;

    triggerIntersections([{ isIntersecting: true, target: root }]);
    expect(root).toHaveAttribute("data-rendered", "true");
    expect(root).toHaveAttribute("data-motion", "static");
    expect(getContext).toHaveBeenCalledOnce();
    const initialFrame = imageDataSnapshot(putImageData);
    expect(vi.getTimerCount()).toBe(0);

    const contextLost = new Event("contextlost", { cancelable: true });
    act(() => canvas.dispatchEvent(contextLost));
    expect(contextLost.defaultPrevented).toBe(false);
    expect(root).not.toHaveAttribute("data-rendered");
    expect(root).toHaveAttribute("data-motion", "static");
    expect(vi.getTimerCount()).toBe(0);

    act(() => canvas.dispatchEvent(new Event("contextrestored")));
    expect(getContext).toHaveBeenCalledTimes(2);
    expect(putImageData).toHaveBeenCalledTimes(2);
    expect(imageDataSnapshot(putImageData)).toEqual(initialFrame);
    expect(root).toHaveAttribute("data-rendered", "true");
    expect(root).toHaveAttribute("data-motion", "static");
    expect(vi.getTimerCount()).toBe(0);
    expect(runtime.frames.size).toBe(0);
  });

  it("keeps the CSS fallback when context creation fails and retries on re-entry", () => {
    installRuntime();
    const putImageData = vi.fn();
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValueOnce(null)
      .mockReturnValue(canvasContext(putImageData));
    const { container } = render(
      <DitherArtwork decorative seed="post:retry" />,
    );
    const root = container.querySelector<HTMLElement>(
      "[data-slot='dither-artwork']",
    );
    expect(root).not.toBeNull();
    if (!root) return;

    triggerIntersections([{ isIntersecting: true, target: root }]);
    expect(root).not.toHaveAttribute("data-rendered");
    expect(root).toHaveAttribute("data-motion", "static");
    expect(vi.getTimerCount()).toBe(0);

    triggerIntersections([{ isIntersecting: false, target: root }]);
    triggerIntersections([{ isIntersecting: true, target: root }]);
    expect(getContext).toHaveBeenCalledTimes(2);
    expect(putImageData).toHaveBeenCalledOnce();
    expect(root).toHaveAttribute("data-rendered", "true");
    expect(root).toHaveAttribute("data-motion", "active");
    expect(vi.getTimerCount()).toBe(1);
  });
});
