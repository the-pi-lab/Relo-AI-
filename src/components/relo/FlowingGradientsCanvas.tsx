"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "@/lib/relo/theme";
import { cn } from "@/lib/utils";

interface FlowingGradientsCanvasProps {
  className?: string;
  variant?: "full" | "subtle" | "hero";
  showNoise?: boolean;
  interactive?: boolean;
}

export function FlowingGradientsCanvas({
  className,
  variant = "full",
  showNoise = true,
  interactive = true,
}: FlowingGradientsCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isDark } = useTheme();
  const mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });
  const animFrameRef = useRef<number | null>(null);

  // Mouse interaction listener
  useEffect(() => {
    if (!interactive) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;

      if ("touches" in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("clientX" in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      mouseRef.current.targetX = clientX / w;
      mouseRef.current.targetY = clientY / h;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
    };
  }, [interactive]);

  // Main canvas animation loop optimized for Tide Swirl Blue
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let time = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : window.innerWidth;
      const h = parent ? parent.clientHeight : window.innerHeight;

      // 1.25x scale for retina crispness + optimal 60fps render
      const scale = Math.min(window.devicePixelRatio || 1, 1.25);
      width = Math.max(w, 320);
      height = Math.max(h, 320);

      canvas.width = Math.floor(width * scale);
      canvas.height = Math.floor(height * scale);
      ctx.scale(scale, scale);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    // Curated Tide Swirl Blue Palette for Dark & Light modes
    const colorsDark = [
      [4, 12, 24],     // #040c18 deep midnight abyss
      [0, 85, 140],    // #00558c deep royal ocean
      [0, 229, 255],   // #00e5ff glowing electric cyan
      [14, 165, 233],  // #0ea5e9 luminous sky blue
    ];

    const colorsLight = [
      [240, 247, 255], // #f0f7ff pure crisp ice
      [186, 230, 253], // #bae6fd soft cyan wash
      [56, 189, 248],  // #38bdf8 vibrant azure
      [147, 197, 253], // #93c5fd periwinkle highlight
    ];

    const colors = isDark ? colorsDark : colorsLight;

    /* People who ask the OS for less motion get one still frame of the same
       swirl instead of a permanent animation loop. */
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const render = () => {
      time += 0.006;

      // Smooth mouse follow
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Base background fill
      const [r0, g0, b0] = colors[0];
      ctx.fillStyle = `rgb(${r0}, ${g0}, ${b0})`;
      ctx.fillRect(0, 0, width, height);

      // Multi-layer flowing fluid silk ribbons
      const ribbonsCount = 4;
      for (let r = 0; r < ribbonsCount; r++) {
        const colorIdx = 1 + (r % (colors.length - 1));
        const [cr, cg, cb] = colors[colorIdx];

        ctx.save();
        ctx.beginPath();

        const waveOffset = r * 1.4;
        const phase = time + waveOffset;

        const startY = height * (0.22 + r * 0.18) + Math.sin(phase * 0.7) * 45;
        ctx.moveTo(-100, startY);

        const steps = 16;
        const stepX = (width + 200) / steps;

        for (let i = 0; i <= steps; i++) {
          const currentX = -100 + i * stepX;
          const normX = i / steps;

          // Harmonic wave equation
          const f1 = Math.sin(phase + normX * 3.0 + mx * 0.7) * 65;
          const f2 = Math.cos(phase * 1.2 - normX * 4.2 + my * 0.5) * 40;

          // Mouse proximity dip
          const dx = normX - mx;
          const mouseDisplace = Math.exp(-dx * dx * 16) * (my - 0.5) * 70;

          const currentY = startY + f1 + f2 + mouseDisplace;
          ctx.lineTo(currentX, currentY);
        }

        ctx.lineTo(width + 100, height + 100);
        ctx.lineTo(-100, height + 100);
        ctx.closePath();

        const ribbonGrad = ctx.createLinearGradient(0, startY - 60, width * 0.75, startY + 200);
        const alpha = isDark
          ? variant === "hero"
            ? 0.75
            : variant === "subtle"
              ? 0.3
              : 0.55
          : variant === "hero"
            ? 0.65
            : 0.25;

        ribbonGrad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${alpha * 0.95})`);
        ribbonGrad.addColorStop(0.45, `rgba(${cr}, ${cg}, ${cb}, ${alpha * 0.6})`);
        ribbonGrad.addColorStop(0.85, `rgba(${r0}, ${g0}, ${b0}, ${alpha * 0.15})`);
        ribbonGrad.addColorStop(1, `rgba(${r0}, ${g0}, ${b0}, 0)`);

        ctx.fillStyle = ribbonGrad;
        ctx.fill();
        ctx.restore();
      }

      // Specular light glow over cursor coordinate
      if (interactive) {
        ctx.save();
        const glowRadius = Math.max(width, height) * 0.45;
        const cursorGlow = ctx.createRadialGradient(
          mx * width,
          my * height,
          0,
          mx * width,
          my * height,
          glowRadius
        );
        const [ar, ag, ab] = colors[2];
        const glowAlpha = isDark ? 0.22 : 0.18;
        cursorGlow.addColorStop(0, `rgba(${ar}, ${ag}, ${ab}, ${glowAlpha})`);
        cursorGlow.addColorStop(0.5, `rgba(${ar}, ${ag}, ${ab}, ${glowAlpha * 0.3})`);
        cursorGlow.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = cursorGlow;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      if (!reduceMotion) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isDark, variant, interactive]);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden transition-opacity duration-1000",
        variant === "subtle" ? "opacity-40" : "opacity-95",
        className
      )}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full object-cover filter blur-[28px] sm:blur-[38px]"
        style={{ willChange: "transform" }}
      />

      {/* Analog film grain / dither layer */}
      {showNoise && (
        <div
          className={cn(
            "absolute inset-0 mix-blend-overlay pointer-events-none",
            isDark ? "opacity-[0.24]" : "opacity-[0.14]"
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Dimensional vignette */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none",
          isDark
            ? "bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.65)_100%)]"
            : "bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.06)_100%)]"
        )}
      />
    </div>
  );
}
