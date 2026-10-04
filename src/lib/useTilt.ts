import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Pointer-driven 3D tilt, the way a physical card responds to a hand.
 *
 * Real perspective, not a fake glow: the caller supplies a scene element and
 * receives rotateX/rotateY in degrees plus a normalised pointer position for
 * spotlight effects. Works with plain CSS `perspective` + `preserve-3d`, so
 * there is no WebGL dependency and no bundle cost.
 *
 * Disabled on touch devices and for prefers-reduced-motion — tilt is
 * decoration, and both of those audiences get a static, readable card.
 */
export function useTilt({ max = 10, scale = 1.02 } = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const [state, setState] = useState({ rx: 0, ry: 0, px: 0.5, py: 0.5, active: false });

  const enabled = () => {
    if (typeof window === "undefined") return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  };

  const onMove = useCallback(
    (e: PointerEvent) => {
      if (!enabled()) return;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;

      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        setState({
          rx: (0.5 - py) * max * 2,
          ry: (px - 0.5) * max * 2,
          px,
          py,
          active: true,
        });
      });
    },
    [max]
  );

  const onLeave = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() =>
      setState((s) => ({ ...s, rx: 0, ry: 0, active: false }))
    );
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled()) return;
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame.current);
    };
  }, [onMove, onLeave]);

  /** Ready-to-spread style for the perspective wrapper. */
  const style: React.CSSProperties = {
    transform: `perspective(1400px) rotateX(${state.rx.toFixed(2)}deg) rotateY(${state.ry.toFixed(
      2
    )}deg) scale(${state.active ? scale : 1})`,
    transition: state.active ? "transform 80ms linear" : "transform 600ms var(--ease)",
    transformStyle: "preserve-3d",
    willChange: "transform",
  };

  return { ref, style, pointer: { x: state.px, y: state.py }, active: state.active };
}
