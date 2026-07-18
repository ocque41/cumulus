import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useContributionTilt } from "./useContributionTilt";

interface TiltHarnessProps {
  active?: boolean;
  enabled: boolean;
  onPositionChange: () => void;
  onResetHover: () => void;
}

function TiltHarness({
  active = false,
  enabled,
  onPositionChange,
  onResetHover,
}: TiltHarnessProps) {
  const {
    frameRef,
    onFramePointerLeave,
    onFramePointerMove,
    onGridPointerEnter,
    onGridPointerLeave,
  } = useContributionTilt({
    active,
    enabled,
    onPositionChange,
    onResetHover,
  });

  return (
    <div
      data-testid="frame"
      onPointerLeave={onFramePointerLeave}
      onPointerMove={onFramePointerMove}
      ref={frameRef}
    >
      <div
        className="contribution-grid"
        data-testid="grid"
        onPointerEnter={onGridPointerEnter}
        onPointerLeave={onGridPointerLeave}
      />
    </div>
  );
}

function stubAnimationFrames() {
  let nextFrame = 0;
  const callbacks = new Map<number, FrameRequestCallback>();
  const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    nextFrame += 1;
    callbacks.set(nextFrame, callback);
    return nextFrame;
  });
  const cancelAnimationFrame = vi.fn((frame: number) => {
    callbacks.delete(frame);
  });
  vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
  vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);

  return {
    callbacks,
    cancelAnimationFrame,
    flush() {
      const pending = [...callbacks.entries()];
      callbacks.clear();
      pending.forEach(([, callback]) => callback(16));
    },
    requestAnimationFrame,
  };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useContributionTilt", () => {
  it("batches pointer work and settles the frame while the grid is active", () => {
    const runtime = stubAnimationFrames();
    const onPositionChange = vi.fn();
    const onResetHover = vi.fn();
    const view = render(
      <TiltHarness
        enabled
        onPositionChange={onPositionChange}
        onResetHover={onResetHover}
      />,
    );
    const frame = screen.getByTestId("frame");
    const grid = screen.getByTestId("grid");
    vi.spyOn(frame, "getBoundingClientRect").mockReturnValue({
      bottom: 200,
      height: 200,
      left: 0,
      right: 1_000,
      top: 0,
      width: 1_000,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerMove(frame, {
      clientX: 700,
      clientY: 80,
      pointerType: "mouse",
    });
    fireEvent.pointerMove(frame, {
      clientX: 900,
      clientY: 100,
      pointerType: "mouse",
    });
    expect(runtime.requestAnimationFrame).toHaveBeenCalledOnce();

    act(() => runtime.flush());
    expect(Number.parseFloat(frame.style.getPropertyValue("--graph-rotate-y")))
      .toBeCloseTo(2.8);
    expect(Number.parseFloat(frame.style.getPropertyValue("--graph-shift-x")))
      .toBeCloseTo(2.4);
    expect(onPositionChange).toHaveBeenCalledOnce();

    view.rerender(
      <TiltHarness
        active
        enabled
        onPositionChange={onPositionChange}
        onResetHover={onResetHover}
      />,
    );
    expect(runtime.requestAnimationFrame).toHaveBeenCalledTimes(2);
    act(() => runtime.flush());
    expect(onPositionChange).toHaveBeenCalledTimes(2);

    fireEvent.pointerEnter(grid, { pointerType: "mouse" });
    expect(frame).toHaveAttribute("data-grid-interacting", "true");
    expect(frame.style.getPropertyValue("--graph-rotate-x")).toBe("0deg");
    expect(frame.style.getPropertyValue("--graph-rotate-y")).toBe("0deg");
    expect(frame.style.getPropertyValue("--graph-shift-x")).toBe("0px");
    expect(frame.style.getPropertyValue("--graph-shift-y")).toBe("0px");
    expect(onPositionChange).toHaveBeenCalledTimes(3);

    fireEvent.pointerLeave(grid, { pointerType: "mouse", relatedTarget: frame });
    expect(frame).not.toHaveAttribute("data-grid-interacting");
    fireEvent.pointerLeave(frame, { pointerType: "mouse" });
    expect(onResetHover).toHaveBeenCalledOnce();
  });

  it("cancels pending work and resets the frame when disabled or unmounted", () => {
    const runtime = stubAnimationFrames();
    const onPositionChange = vi.fn();
    const onResetHover = vi.fn();
    const view = render(
      <TiltHarness
        enabled
        onPositionChange={onPositionChange}
        onResetHover={onResetHover}
      />,
    );
    const frame = screen.getByTestId("frame");

    fireEvent.pointerMove(frame, {
      clientX: 400,
      clientY: 100,
      pointerType: "mouse",
    });
    expect(runtime.requestAnimationFrame).toHaveBeenCalledOnce();

    view.rerender(
      <TiltHarness
        enabled={false}
        onPositionChange={onPositionChange}
        onResetHover={onResetHover}
      />,
    );
    expect(runtime.cancelAnimationFrame).toHaveBeenCalledWith(1);
    expect(runtime.callbacks).toHaveLength(0);
    expect(frame.style.getPropertyValue("--graph-rotate-x")).toBe("0deg");
    expect(frame.style.getPropertyValue("--graph-rotate-y")).toBe("0deg");

    fireEvent.pointerMove(frame, {
      clientX: 600,
      clientY: 100,
      pointerType: "mouse",
    });
    expect(runtime.requestAnimationFrame).toHaveBeenCalledOnce();

    view.rerender(
      <TiltHarness
        enabled
        onPositionChange={onPositionChange}
        onResetHover={onResetHover}
      />,
    );
    fireEvent.pointerMove(frame, {
      clientX: 600,
      clientY: 100,
      pointerType: "mouse",
    });
    expect(runtime.requestAnimationFrame).toHaveBeenCalledTimes(2);
    view.unmount();
    expect(runtime.cancelAnimationFrame).toHaveBeenCalledWith(2);
    expect(runtime.callbacks).toHaveLength(0);
  });
});
