"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

export type GradientPresetId =
  | "tide-swirl"
  | "rose-swirl"
  | "mercury-chrome"
  | "sunset-mesh"
  | "sage-matcha"
  | "noir-mesh";

export interface GradientPreset {
  id: GradientPresetId;
  name: string;
  tagline: string;
  category: "Swirl" | "Mesh" | "Chrome";
  colors: string[];
  stops: [number, number, number, number]; // color stops
  accentColor: string;
  glowColor: string;
  cardBorder: string;
  description: string;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    id: "tide-swirl",
    name: "Tide Swirl",
    tagline: "Cold blue ribbons turning slowly, like current seen from above",
    category: "Swirl",
    colors: ["#0a192f", "#0077b6", "#00e5ff", "#03045e"],
    stops: [0.1, 0.4, 0.75, 0.95],
    accentColor: "#00e5ff",
    glowColor: "rgba(0, 229, 255, 0.22)",
    cardBorder: "rgba(0, 229, 255, 0.2)",
    description: "Flowing oceanic current with electric cyan highlights and deep navy undertones.",
  },
  {
    id: "rose-swirl",
    name: "Rose Swirl",
    tagline: "Rose and wine folding through each other in soft wide bands",
    category: "Swirl",
    colors: ["#2d0a1e", "#9d174d", "#f43f5e", "#4c0519"],
    stops: [0.15, 0.45, 0.75, 0.95],
    accentColor: "#fb7185",
    glowColor: "rgba(244, 63, 94, 0.24)",
    cardBorder: "rgba(244, 63, 94, 0.22)",
    description: "Luminous magenta and velvety wine silk with glowing specular crests.",
  },
  {
    id: "mercury-chrome",
    name: "Mercury Chrome",
    tagline: "Liquid metal folds with high-specular titanium reflection",
    category: "Chrome",
    colors: ["#0f1115", "#2a2e39", "#8892b0", "#e2e8f0"],
    stops: [0.1, 0.4, 0.7, 0.95],
    accentColor: "#38bdf8",
    glowColor: "rgba(226, 232, 240, 0.16)",
    cardBorder: "rgba(255, 255, 255, 0.22)",
    description: "Ultra-premium liquid chrome and brushed metallic ripples inspired by luxury automotive consoles.",
  },
  {
    id: "sunset-mesh",
    name: "Sunset Mesh",
    tagline: "Warm amber into rose into violet, the last twenty minutes of light",
    category: "Mesh",
    colors: ["#1c0f0a", "#b45309", "#ea580c", "#7c2d12"],
    stops: [0.1, 0.4, 0.72, 0.95],
    accentColor: "#fb923c",
    glowColor: "rgba(234, 88, 12, 0.22)",
    cardBorder: "rgba(251, 146, 60, 0.22)",
    description: "Warm sunset terracotta and glowing ember bands with golden amber specular crests.",
  },
  {
    id: "sage-matcha",
    name: "Sage Matcha",
    tagline: "Sage, clay and oat greens breathing gently with zero harsh glare",
    category: "Mesh",
    colors: ["#0c1910", "#1b4332", "#40916c", "#52b788"],
    stops: [0.12, 0.4, 0.7, 0.95],
    accentColor: "#74c69d",
    glowColor: "rgba(82, 183, 136, 0.2)",
    cardBorder: "rgba(116, 198, 157, 0.2)",
    description: "Japanese matcha, sage clay, and soothing bio-luminous green mist for high-focus sessions.",
  },
  {
    id: "noir-mesh",
    name: "Noir Mesh",
    tagline: "Graphite silk with paper-white crest, carried by subtle analog dither",
    category: "Mesh",
    colors: ["#050507", "#12131a", "#252837", "#00f0ff"],
    stops: [0.1, 0.45, 0.8, 0.98],
    accentColor: "#00f0ff",
    glowColor: "rgba(0, 240, 255, 0.18)",
    cardBorder: "rgba(0, 240, 255, 0.2)",
    description: "Deep obsidian stealth canvas with ultra-fine analog film grain and razor-sharp cyan signal lines.",
  },
];

interface GradientContextType {
  preset: GradientPreset;
  presetId: GradientPresetId;
  setPresetId: (id: GradientPresetId) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  intensity: number;
  setIntensity: (intensity: number) => void;
  isInteractive: boolean;
  setIsInteractive: (val: boolean) => void;
}

const STORAGE_KEY = "relo-gradient-preset";

const GradientContext = createContext<GradientContextType>({
  preset: GRADIENT_PRESETS[0],
  presetId: "tide-swirl",
  setPresetId: () => {},
  speed: 1,
  setSpeed: () => {},
  intensity: 1,
  setIntensity: () => {},
  isInteractive: true,
  setIsInteractive: () => {},
});

export function GradientProvider({ children }: { children: React.ReactNode }) {
  const [presetId, setPresetIdState] = useState<GradientPresetId>("tide-swirl");
  const [speed, setSpeed] = useState<number>(1);
  const [intensity, setIntensity] = useState<number>(1);
  const [isInteractive, setIsInteractive] = useState<boolean>(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as GradientPresetId | null;
      if (saved && GRADIENT_PRESETS.some((p) => p.id === saved)) {
        setPresetIdState(saved);
      }
    } catch {
      // ignore storage error
    }
  }, []);

  const setPresetId = (id: GradientPresetId) => {
    setPresetIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
  };

  const preset = useMemo(() => {
    return GRADIENT_PRESETS.find((p) => p.id === presetId) || GRADIENT_PRESETS[0];
  }, [presetId]);

  return (
    <GradientContext.Provider
      value={{
        preset,
        presetId,
        setPresetId,
        speed,
        setSpeed,
        intensity,
        setIntensity,
        isInteractive,
        setIsInteractive,
      }}
    >
      {children}
    </GradientContext.Provider>
  );
}

export function useGradientPreset() {
  return useContext(GradientContext);
}
