import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DITHER_VARIANTS } from "@/content/post-types";

const anime = vi.hoisted(() => ({
  animate: vi.fn(),
  createScope: vi.fn(),
  motionAllowed: true,
  revert: vi.fn(),
  stagger: vi.fn(() => 0),
}));

vi.mock("./post-signal-anime", () => ({
  animate: anime.animate,
  createScope: (...args: unknown[]) => {
    anime.createScope(...args);
    let cleanupScope: (() => void) | undefined;
    const scope = {
      add: (constructor: (active?: { matches: { motion: boolean } }) => (() => void) | void) => {
        cleanupScope = constructor({ matches: { motion: anime.motionAllowed } }) || undefined;
        return scope;
      },
      revert: () => {
        anime.revert();
        cleanupScope?.();
      },
    };
    return scope;
  },
  stagger: anime.stagger,
}));

import { PostSignalArtwork } from "./PostSignalArtwork";

interface ObserverHarness {
  callback: IntersectionObserverCallback;
  disconnect: ReturnType<typeof vi.fn>;
  options?: IntersectionObserverInit;
  target?: Element;
}

const observers: ObserverHarness[] = [];
const motionListeners = new Set<() => void>();

class IntersectionObserverMock {
  private readonly harness: ObserverHarness;

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.harness = { callback, disconnect: vi.fn(), options };
    observers.push(this.harness);
  }

  disconnect() {
    this.harness.disconnect();
  }

  observe(target: Element) {
    this.harness.target = target;
  }

  unobserve() {}
}

function setIntersections(
  harness: ObserverHarness,
  entries: Array<{ intersectionRatio: number; isIntersecting: boolean }>,
) {
  if (!harness.target) throw new Error("Expected an observed signal artwork");
  harness.callback(
    entries.map((entry) => ({
      ...entry,
      target: harness.target,
    }) as IntersectionObserverEntry),
    {} as IntersectionObserver,
  );
}

function setIntersection(
  harness: ObserverHarness,
  isIntersecting: boolean,
  intersectionRatio = isIntersecting ? 1 : 0,
) {
  setIntersections(harness, [{ intersectionRatio, isIntersecting }]);
}

function observerFor(target: Element) {
  return observers.find((observer) => observer.target === target);
}

beforeEach(() => {
  anime.motionAllowed = true;
  vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
  vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
    addEventListener: (_type: string, listener: () => void) => motionListeners.add(listener),
    dispatchEvent: vi.fn(),
    get matches() {
      return query.includes("no-preference") ? anime.motionAllowed : false;
    },
    media: query,
    onchange: null,
    removeEventListener: (_type: string, listener: () => void) => motionListeners.delete(listener),
  })));
});

afterEach(() => {
  cleanup();
  observers.length = 0;
  motionListeners.clear();
  anime.animate.mockClear();
  anime.createScope.mockClear();
  anime.revert.mockClear();
  anime.stagger.mockClear();
  vi.unstubAllGlobals();
});

describe("PostSignalArtwork", () => {
  it("keeps meaningful and decorative artwork semantics deterministic", () => {
    render(
      <>
        <PostSignalArtwork label="A record lattice" seed="post:one" variant="record-lattice" />
        <PostSignalArtwork decorative seed="post:one" variant="record-lattice" />
      </>,
    );

    const meaningful = screen.getByRole("img", { name: "A record lattice" });
    const roots = document.querySelectorAll<HTMLElement>("[data-slot='post-signal-artwork']");

    expect(meaningful).toBe(roots[0]);
    expect(roots[1]).toHaveAttribute("aria-hidden", "true");
    expect(roots[1]).not.toHaveAttribute("role");
    expect(roots[0]?.dataset.ditherSeed).toBe(roots[1]?.dataset.ditherSeed);
    expect(roots[0]).toHaveAttribute("data-motion", "static");
  });

  it("renders a distinct diagram for every named post variant and four unique corners", () => {
    const { container } = render(
      <>
        {DITHER_VARIANTS.map((variant) => (
          <PostSignalArtwork decorative key={variant} seed={`post:${variant}`} variant={variant} />
        ))}
      </>,
    );

    const roots = container.querySelectorAll<HTMLElement>("[data-slot='post-signal-artwork']");
    const diagrams = Array.from(roots, (root) =>
      root.querySelector(".post-signal__diagram")?.innerHTML,
    );

    expect(roots).toHaveLength(DITHER_VARIANTS.length);
    expect(new Set(diagrams).size).toBe(DITHER_VARIANTS.length);
    for (const root of roots) {
      const corners = root.querySelectorAll<HTMLElement>(".post-signal__corner");
      expect(corners).toHaveLength(4);
      expect(new Set(Array.from(corners, (corner) => corner.dataset.cornerMotif)).size)
        .toBe(4);
    }
  });

  it("starts smooth scoped motion only near the viewport and reverts offscreen", async () => {
    const { container } = render(
      <PostSignalArtwork decorative seed="post:motion" variant="event-river" />,
    );
    const root = container.querySelector<HTMLElement>("[data-slot='post-signal-artwork']");
    const observer = observers[0];
    expect(root).not.toBeNull();
    expect(observer).toBeDefined();
    if (!root || !observer) return;

    expect(observer.options).toEqual({ rootMargin: "0px", threshold: 0.1 });
    expect(anime.animate).not.toHaveBeenCalled();

    setIntersection(observer, true, 0.09);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(root).toHaveAttribute("data-motion", "static");
    expect(anime.createScope).not.toHaveBeenCalled();

    setIntersection(observer, true);
    await waitFor(() => expect(root).toHaveAttribute("data-motion", "active"));
    expect(anime.animate).toHaveBeenCalled();
    expect(
      anime.animate.mock.calls.every(([targets]) => (
        Array.isArray(targets) && targets.length <= 5
      )),
    ).toBe(true);
    expect(
      anime.animate.mock.calls.some(([, parameters]) => (
        Object.hasOwn(parameters as object, "strokeDashoffset")
      )),
    ).toBe(false);

    setIntersection(observer, false);
    expect(root).toHaveAttribute("data-motion", "static");
    expect(anime.revert).toHaveBeenCalledOnce();

    setIntersection(observer, true);
    await waitFor(() => expect(anime.createScope).toHaveBeenCalledTimes(2));
    expect(root).toHaveAttribute("data-motion", "active");
    setIntersection(observer, false);
    expect(anime.revert).toHaveBeenCalledTimes(2);
  });

  it("uses the newest matching observer entry from a batched delivery", async () => {
    const { container } = render(
      <PostSignalArtwork decorative seed="post:batch" variant="signal-window" />,
    );
    const root = container.querySelector<HTMLElement>("[data-slot='post-signal-artwork']");
    const observer = root ? observerFor(root) : undefined;
    if (!root || !observer) throw new Error("Expected signal artwork and observer");

    setIntersections(observer, [
      { intersectionRatio: 1, isIntersecting: true },
      { intersectionRatio: 0, isIntersecting: false },
    ]);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(root).toHaveAttribute("data-motion", "static");
    expect(anime.createScope).not.toHaveBeenCalled();

    setIntersections(observer, [
      { intersectionRatio: 0, isIntersecting: false },
      { intersectionRatio: 0.72, isIntersecting: true },
    ]);

    await waitFor(() => expect(root).toHaveAttribute("data-motion", "active"));
    expect(anime.createScope).toHaveBeenCalledOnce();
  });

  it("keeps one eligible candidate active and promotes a fallback", async () => {
    const { container, rerender } = render(
      <>
        <PostSignalArtwork decorative key="first" seed="post:first" variant="event-river" />
        <PostSignalArtwork decorative key="second" seed="post:second" variant="local-orbit" />
      </>,
    );
    const roots = container.querySelectorAll<HTMLElement>("[data-slot='post-signal-artwork']");
    const first = roots[0];
    const second = roots[1];
    const firstObserver = first ? observerFor(first) : undefined;
    const secondObserver = second ? observerFor(second) : undefined;
    if (!first || !second || !firstObserver || !secondObserver) {
      throw new Error("Expected two signal artworks and observers");
    }

    setIntersection(firstObserver, true, 0.6);
    await waitFor(() => expect(first).toHaveAttribute("data-motion", "active"));
    expect(container.querySelectorAll("[data-motion='active']")).toHaveLength(1);

    setIntersection(secondObserver, true, 0.8);
    expect(first).toHaveAttribute("data-motion", "active");
    expect(second).toHaveAttribute("data-motion", "static");
    expect(anime.createScope).toHaveBeenCalledOnce();

    setIntersection(firstObserver, false);
    await waitFor(() => expect(second).toHaveAttribute("data-motion", "active"));
    expect(first).toHaveAttribute("data-motion", "static");
    expect(container.querySelectorAll("[data-motion='active']")).toHaveLength(1);
    expect(anime.createScope).toHaveBeenCalledTimes(2);
    expect(anime.revert).toHaveBeenCalledOnce();

    setIntersection(firstObserver, true, 0.9);
    expect(second).toHaveAttribute("data-motion", "active");
    expect(first).toHaveAttribute("data-motion", "static");

    rerender(
      <>
        <PostSignalArtwork decorative key="first" seed="post:first" variant="event-river" />
      </>,
    );

    await waitFor(() => expect(first).toHaveAttribute("data-motion", "active"));
    expect(container.querySelectorAll("[data-motion='active']")).toHaveLength(1);
    expect(anime.createScope).toHaveBeenCalledTimes(3);
    expect(anime.revert).toHaveBeenCalledTimes(2);

    setIntersection(firstObserver, false);
    expect(first).toHaveAttribute("data-motion", "static");
    expect(anime.revert).toHaveBeenCalledTimes(3);
  });

  it("avoids loading motion while reduced motion is requested and reacts to changes", async () => {
    anime.motionAllowed = false;
    const { container } = render(
      <PostSignalArtwork decorative seed="post:still" variant="local-orbit" />,
    );
    const root = container.querySelector<HTMLElement>("[data-slot='post-signal-artwork']");
    const observer = observers[0];
    if (!root || !observer) throw new Error("Expected signal artwork and observer");

    setIntersection(observer, true);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(root).toHaveAttribute("data-motion", "static");
    expect(anime.createScope).not.toHaveBeenCalled();
    expect(anime.animate).not.toHaveBeenCalled();

    anime.motionAllowed = true;
    motionListeners.forEach((listener) => listener());
    await waitFor(() => expect(root).toHaveAttribute("data-motion", "active"));
    expect(anime.createScope).toHaveBeenCalledOnce();

    anime.motionAllowed = false;
    motionListeners.forEach((listener) => listener());
    expect(root).toHaveAttribute("data-motion", "static");
    expect(anime.revert).toHaveBeenCalledOnce();
  });
});
