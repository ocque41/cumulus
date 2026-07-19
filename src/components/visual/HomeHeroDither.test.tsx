import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const heroProps = vi.hoisted(() => [] as Array<Record<string, unknown>>);
const animateMock = vi.hoisted(() => vi.fn());
const revertMock = vi.hoisted(() => vi.fn());

vi.mock("animejs/animation", () => ({ animate: animateMock }));
vi.mock("animejs/scope", () => ({
  createScope: vi.fn(() => ({
    add(callback: () => void) {
      callback();
      return this;
    },
    revert: revertMock,
  })),
}));
vi.mock("@/components/visual/HeroDither", () => ({
  HeroDither: (props: Record<string, unknown>) => {
    heroProps.push(props);
    return <div data-slot="hero-dither" />;
  },
}));

import { HomeHeroDither } from "./HomeHeroDither";

afterEach(() => {
  cleanup();
  heroProps.length = 0;
  animateMock.mockClear();
  revertMock.mockClear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("HomeHeroDither", () => {
  it("merges the restored wave and current warp fields without replacing either", () => {
    const { container, unmount } = render(<HomeHeroDither />);

    expect(heroProps).toHaveLength(2);
    expect(heroProps[0]).toEqual(expect.objectContaining({
      priority: true,
      scale: 0.62,
      shape: "wave",
      size: 3,
      type: "8x8",
    }));
    expect(heroProps[1]).toEqual(expect.objectContaining({
      priority: true,
      scale: 0.9,
      shape: "warp",
      size: 2.25,
      type: "8x8",
    }));
    expect(container.querySelector("[data-slot='home-hero-dither-composition']"))
      .toHaveAttribute("data-motion", "active");
    expect(animateMock).toHaveBeenCalledTimes(3);

    unmount();
    expect(revertMock).toHaveBeenCalledOnce();
  });

  it("keeps the complete merged artwork static when reduced motion is requested", () => {
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    }));

    const { container } = render(<HomeHeroDither />);

    expect(heroProps).toHaveLength(2);
    expect(container.querySelector("[data-slot='home-hero-dither-composition']"))
      .toHaveAttribute("data-motion", "static");
    expect(animateMock).not.toHaveBeenCalled();
  });
});
