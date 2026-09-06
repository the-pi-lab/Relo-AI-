/**
 * LAYER 7 — Scene/section state management.
 * GSAP scrub writes progress here every frame; the 3D stage reads it.
 * Kept as a module singleton so Canvas and DOM stay in sync without
 * re-rendering React on every scroll tick.
 */
let progress = 0;

export function updateGlobalScroll(p: number) {
  progress = Math.max(0, Math.min(1, p));
}

export function getScrollProgress(): number {
  return progress;
}
