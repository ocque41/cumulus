import { animate, remove } from "animejs";

const HOVER_DURATION = 180;
const PRESS_DURATION = 120;

export function playLiquidHover(element: HTMLElement) {
  animate(element, {
    scale: [1, 1.01],
    borderColor: ["rgba(255, 255, 255, 0.12)", "rgba(255, 255, 255, 0.28)"],
    duration: HOVER_DURATION,
    easing: "easeOutQuad",
  });
}

export function playLiquidLeave(element: HTMLElement) {
  animate(element, {
    scale: [1.01, 1],
    borderColor: ["rgba(255, 255, 255, 0.28)", "rgba(255, 255, 255, 0.12)"],
    duration: HOVER_DURATION,
    easing: "easeOutQuad",
  });
}

export function playLiquidPress(element: HTMLElement) {
  animate(element, {
    scale: [1, 0.99],
    duration: PRESS_DURATION,
    easing: "easeOutSine",
  });
}

export function playLiquidRelease(element: HTMLElement) {
  animate(element, {
    scale: [0.99, 1],
    duration: PRESS_DURATION,
    easing: "easeOutSine",
  });
}

export function playLiquidFocus(element: HTMLElement) {
  animate(element, {
    borderColor: ["rgba(255, 255, 255, 0.12)", "rgba(255, 255, 255, 0.34)"],
    duration: 150,
    easing: "easeOutQuad",
  });
}

export function clearLiquidAnimations(element: HTMLElement) {
  remove(element);
}
