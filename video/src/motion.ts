import { Easing, interpolate } from "remotion";

export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 30;
export const DURATION_FRAMES = 1200; // 40.0s

export const PREMIUM = Easing.bezier(0.22, 1, 0.36, 1);

export const COLORS = {
  bg: "#F3EFE6",
  paper: "#FFFEF9",
  slate: "#1C211D",
  green: "#1B4332",
  mint: "#A8C4A0",
  seafoam: "#C5D6C8",
  muted: "rgba(28,33,29,0.48)",
  line: "rgba(28,33,29,0.12)",
  fog: "rgba(28,33,29,0.06)",
} as const;

export function clampReveal(frame: number, start: number, dur = 26) {
  return interpolate(frame, [start, start + dur], [0, 1], {
    easing: PREMIUM,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

export function clampBlur(frame: number, start: number, dur = 28, from = 12) {
  return interpolate(frame, [start, start + dur], [from, 0], {
    easing: PREMIUM,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

export function sceneOut(frame: number, duration: number, tail = 14) {
  const t = interpolate(frame, [duration - tail, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return {
    opacity: 1 - t,
    blur: t * 8,
  };
}

export function drift(frame: number, amp: number, seconds: number, phase = 0) {
  return Math.sin((frame / FPS) * ((Math.PI * 2) / seconds) + phase) * amp;
}
