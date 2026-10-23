"use client";

import React, { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useGradientPreset } from "@/lib/relo/gradients";
import { useTheme } from "@/lib/relo/theme";

interface Card3DProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
  glowOnHover?: boolean;
  onClick?: () => void;
}

export function Card3D({
  children,
  className,
  intensity = 15,
  glare = true,
  glowOnHover = true,
  onClick,
  ...props
}: Card3DProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const { preset } = useGradientPreset();
  const { isDark } = useTheme();

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width; // 0 to 1
      const y = (e.clientY - rect.top) / rect.height; // 0 to 1

      const rotateY = (x - 0.5) * intensity;
      const rotateX = (0.5 - y) * intensity;

      setRotate({ x: rotateX, y: rotateY });
      setGlarePos({ x: x * 100, y: y * 100, opacity: isDark ? 0.25 : 0.15 });
    },
    [intensity, isDark]
  );

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  const defaultShadow = isDark
    ? "0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.08)"
    : "0 10px 30px -10px rgba(0, 0, 0, 0.08), 0 0 1px 1px rgba(0, 0, 0, 0.05)";

  const hoverShadow = isDark
    ? `0 24px 60px -15px ${preset.glowColor}, 0 0 1px 1px rgba(255, 255, 255, 0.15)`
    : `0 20px 50px -12px ${preset.glowColor}, 0 0 1px 1px rgba(0, 0, 0, 0.08)`;

  return (
    <div
      style={{ perspective: "1000px" }}
      className="inline-block w-full"
      onClick={onClick}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) ${
            isHovered ? "scale3d(1.015, 1.015, 1.015)" : "scale3d(1, 1, 1)"
          }`,
          transformStyle: "preserve-3d",
          boxShadow: isHovered && glowOnHover ? hoverShadow : defaultShadow,
        }}
        className={cn(
          "relative overflow-hidden rounded-2xl border backdrop-blur-2xl transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out will-change-transform",
          isDark
            ? "border-white/10 bg-black/40 text-white"
            : "border-black/8 bg-white/80 text-zinc-900",
          className
        )}
        {...props}
      >
        {/* Dynamic Specular Glare Layer */}
        {glare && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
            style={{
              opacity: glarePos.opacity,
              background: `radial-gradient(circle 350px at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.35), transparent 70%)`,
              mixBlendMode: "overlay",
            }}
          />
        )}

        {/* Subtle top rim highlight line */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent z-10"
        />

        {/* Card Content with 3D depth */}
        <div className="relative z-10 h-full">{children}</div>
      </div>
    </div>
  );
}

export function Card3DLayer({
  children,
  depth = 20,
  className,
}: {
  children: React.ReactNode;
  depth?: number;
  className?: string;
}) {
  return (
    <div
      style={{
        transform: `translateZ(${depth}px)`,
        transformStyle: "preserve-3d",
      }}
      className={cn("transition-transform duration-200", className)}
    >
      {children}
    </div>
  );
}
