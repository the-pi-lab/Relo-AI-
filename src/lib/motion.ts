import { useEffect, useRef, useState } from "react";

/** Motion is decoration: never run it for reduced-motion or touch users. */
function motionAllowed(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/**
 * Spotlight cards — a light that follows the cursor across a card.
 *
 * Delegated at the container level so it is one listener for the whole grid,
 * not one per card. Writes --mx/--my custom properties on the hovered card;
 * the CSS draws a radial gradient at that point.
 */
export function useSpotlight<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || !motionAllowed()) return;

    const onMove = (e: PointerEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>("[data-spot]");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      card.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    };

    root.addEventListener("pointermove", onMove);
    return () => root.removeEventListener("pointermove", onMove);
  }, []);

  return ref;
}

/**
 * Count-up on first reveal.
 *
 * Runs once, when the element scrolls into view, over `duration` ms with an
 * ease-out cubic — the number lands softly instead of snapping. Formats with
 * `toLocaleString` so 1,000 stays readable.
 */
export function useCountUp(target: number, duration = 1300) {
  const ref = useRef<HTMLElement>(null);
  const [value, setValue] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || done.current) return;
    if (!motionAllowed()) {
      setValue(target);
      done.current = true;
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          io.disconnect();
          done.current = true;

          const t0 = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - t0) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(Math.round(target * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);

  return { ref, value, display: value.toLocaleString("en-US") };
}
