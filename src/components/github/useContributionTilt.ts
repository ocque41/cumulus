import {
  type PointerEvent as ReactPointerEvent,
  type PointerEventHandler,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";

interface ContributionTiltOptions {
  active: boolean;
  enabled: boolean;
  onPositionChange: () => void;
  onResetHover: () => void;
}

interface ContributionTilt {
  frameRef: RefObject<HTMLDivElement | null>;
  onFramePointerLeave: PointerEventHandler<HTMLDivElement> | undefined;
  onFramePointerMove: PointerEventHandler<HTMLDivElement> | undefined;
  onGridPointerEnter: PointerEventHandler<HTMLDivElement>;
  onGridPointerLeave: PointerEventHandler<HTMLDivElement>;
}

interface PointerPosition {
  clientX: number;
  clientY: number;
}

function resetTransform(frame: HTMLDivElement, gridInteracting = false) {
  if (gridInteracting) frame.dataset.gridInteracting = "true";
  else delete frame.dataset.gridInteracting;

  frame.style.setProperty("--graph-rotate-x", "0deg");
  frame.style.setProperty("--graph-rotate-y", "0deg");
  frame.style.setProperty("--graph-shift-x", "0px");
  frame.style.setProperty("--graph-shift-y", "0px");
}

export function useContributionTilt({
  active,
  enabled,
  onPositionChange,
  onResetHover,
}: ContributionTiltOptions): ContributionTilt {
  const frameRef = useRef<HTMLDivElement>(null);
  const pointerFrameRef = useRef<number | undefined>(undefined);
  const latestPointerRef = useRef<PointerPosition | undefined>(undefined);

  const cancelPointerFrame = useCallback(() => {
    if (pointerFrameRef.current === undefined) return;
    cancelAnimationFrame(pointerFrameRef.current);
    pointerFrameRef.current = undefined;
  }, []);

  const clearTilt = useCallback((gridInteracting = false) => {
    cancelPointerFrame();
    latestPointerRef.current = undefined;
    const frame = frameRef.current;
    if (frame) resetTransform(frame, gridInteracting);
  }, [cancelPointerFrame]);

  const applyPointerFrame = useCallback(() => {
    pointerFrameRef.current = undefined;
    const frame = frameRef.current;
    const pointer = latestPointerRef.current;
    if (!enabled || !frame || !pointer) return;

    const rect = frame.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, pointer.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, pointer.clientY - rect.top));
    const normalizedX = x / Math.max(rect.width, 1) - 0.5;
    const normalizedY = y / Math.max(rect.height, 1) - 0.5;

    frame.style.setProperty("--graph-rotate-x", `${normalizedY * -5}deg`);
    frame.style.setProperty("--graph-rotate-y", `${normalizedX * 7}deg`);
    frame.style.setProperty("--graph-shift-x", `${normalizedX * 6}px`);
    frame.style.setProperty("--graph-shift-y", `${normalizedY * 5}px`);
    onPositionChange();
  }, [enabled, onPositionChange]);

  const schedulePointerFrame = useCallback(() => {
    if (
      !enabled
      || pointerFrameRef.current !== undefined
      || !latestPointerRef.current
    ) return;
    pointerFrameRef.current = requestAnimationFrame(applyPointerFrame);
  }, [applyPointerFrame, enabled]);

  const settleFrameForGrid = useCallback(() => {
    if (!enabled || !frameRef.current) return;
    clearTilt(true);
    onPositionChange();
  }, [clearTilt, enabled, onPositionChange]);

  const moveFrame = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!enabled || event.pointerType === "touch") return;
    if (
      event.target instanceof Element
      && event.target.closest(".contribution-grid")
    ) {
      settleFrameForGrid();
      return;
    }

    delete event.currentTarget.dataset.gridInteracting;
    latestPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
    schedulePointerFrame();
  }, [enabled, schedulePointerFrame, settleFrameForGrid]);

  const resetFrame = useCallback(() => {
    if (!frameRef.current) return;
    clearTilt();
    onResetHover();
  }, [clearTilt, onResetHover]);

  const releaseGrid = useCallback(() => {
    if (frameRef.current) delete frameRef.current.dataset.gridInteracting;
  }, []);

  const enterGrid = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") settleFrameForGrid();
  }, [settleFrameForGrid]);

  useLayoutEffect(() => {
    if (!enabled) clearTilt();
  }, [clearTilt, enabled]);

  useEffect(() => {
    if (active) schedulePointerFrame();
  }, [active, schedulePointerFrame]);

  useEffect(() => () => {
    cancelPointerFrame();
  }, [cancelPointerFrame]);

  return {
    frameRef,
    onFramePointerLeave: enabled ? resetFrame : undefined,
    onFramePointerMove: enabled ? moveFrame : undefined,
    onGridPointerEnter: enterGrid,
    onGridPointerLeave: releaseGrid,
  };
}
