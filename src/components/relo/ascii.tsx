"use client";

/**
 * RELO ASCII engine — renders programmatic canvas scenes as living ASCII art.
 *
 * How it works: a scene function paints into a tiny offscreen buffer whose
 * resolution IS the character grid (one pixel per cell). We then read the
 * buffer, map brightness → character ramp and colour stops, and paint glyphs
 * onto a visible canvas. From afar it reads as a pixelated image; up close
 * it's pure text.
 *
 * Colour language: scenes mark "special" pixels with saturated colours —
 *   · red-dominant marker  (e.g. #ff2800) → violet accent
 *   · gold marker          (e.g. #ffc355) → moon-gold
 * The cursor "resolves" nearby characters (brighter + accent), a scanline
 * shimmer keeps the piece breathing while idle, and an optional sweep line
 * travels the grid like a slow radar.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@/lib/relo/theme";

export type SceneFn = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number
) => void;

export const RAMPS = {
  classic: " .`:;-=+*x#%@",
  soft: "  .·:;+ioxX$&@",
  blocks: " ░▒▓█",
  dots: " ⠁⠂⠄⡀⢀⠠⠐⠈  ·:∴•+*#",
} as const;

/* markers scenes paint with — the engine translates them to world colours */
export const INK = {
  stroke: "#f2f0fb", /* bone — structural lines */
  soft: "#8d87ab",   /* mid-grey violet — secondary */
  accent: "#ff2800", /* red marker → rendered as iris accent */
  gold: "#ffc355",   /* gold marker → rendered as moon-gold */
  faint: "#514b6e",  /* barely-there guides */
} as const;

/* ── the portal scene: a glowing doorway, standing open ──────────────── */

export const portalScene: SceneFn = (ctx, w, h, t) => {
  ctx.clearRect(0, 0, w, h);
  const u = Math.min(w, h) / 100;
  const { stroke, soft, accent, gold, faint } = INK;

  const cx = w / 2;
  const groundY = h * 0.88;

  /* light spilling from the door */
  const breathe = 0.5 + 0.5 * Math.sin(t * 0.0012);
  const grad = ctx.createRadialGradient(cx, groundY - h * 0.28, u * 2, cx, groundY - h * 0.28, w * 0.34);
  grad.addColorStop(0, `rgba(255,40,0,${0.5 + breathe * 0.18})`);
  grad.addColorStop(1, "rgba(255,40,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  /* the doorway — a tall arch, drawn as nested frames */
  const dw = w * 0.34;
  const dh = h * 0.62;
  const dx = cx - dw / 2;
  const dy = groundY - dh;

  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(1, u * 1.1);
  rr(ctx, dx, dy, dw, dh, dw / 2);
  ctx.stroke();

  /* inner glow arch — the threshold itself */
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1, u * 0.9);
  rr(ctx, dx + u * 3, dy + u * 3, dw - u * 6, dh - u * 3, (dw - u * 6) / 2);
  ctx.stroke();

  /* the light floor inside the door */
  ctx.fillStyle = gold;
  const floorPulse = 0.55 + 0.45 * Math.sin(t * 0.0021);
  ctx.globalAlpha = 0.5 + floorPulse * 0.5;
  rr(ctx, dx + u * 5, groundY - u * 4, dw - u * 10, u * 3, u);
  ctx.fill();
  ctx.globalAlpha = 1;

  /* steps descending from the door */
  ctx.strokeStyle = faint;
  for (let i = 1; i <= 3; i++) {
    const sw = dw * (1 + i * 0.34);
    ctx.beginPath();
    ctx.moveTo(cx - sw / 2, groundY + u * 3.4 * i);
    ctx.lineTo(cx + sw / 2, groundY + u * 3.4 * i);
    ctx.stroke();
  }

  /* side pillars — observatory towers */
  ctx.strokeStyle = soft;
  ctx.lineWidth = Math.max(0.8, u * 0.7);
  for (const px of [dx - dw * 0.42, dx + dw * 1.42]) {
    ctx.beginPath();
    ctx.moveTo(px, groundY);
    ctx.lineTo(px, groundY - h * 0.3);
    ctx.stroke();
    /* beacon on top */
    const blink = 0.5 + 0.5 * Math.sin(t * 0.003 + (px > cx ? 1.2 : 0));
    ctx.globalAlpha = 0.35 + blink * 0.65;
    ctx.fillStyle = px > cx ? gold : soft;
    ctx.fillRect(px - u * 0.9, groundY - h * 0.3 - u * 1.6, u * 1.8, u * 1.8);
    ctx.globalAlpha = 1;
  }

  /* drifting motes rising from the threshold */
  for (let i = 0; i < 7; i++) {
    const ph = t * 0.00035 + i * 1.35;
    const rise = (ph % 1);
    const mx = cx + Math.sin(i * 2.7 + t * 0.0006) * dw * 0.34;
    const my = groundY - rise * dh * 0.92;
    ctx.globalAlpha = Math.sin(rise * Math.PI) * 0.75;
    ctx.fillStyle = i % 3 === 0 ? gold : soft;
    ctx.fillRect(mx, my, u, u * 1.4);
  }
  ctx.globalAlpha = 1;

  /* horizon dotted line */
  ctx.strokeStyle = faint;
  ctx.setLineDash([u, u * 2.2]);
  ctx.beginPath();
  ctx.moveTo(w * 0.04, groundY + u * 13);
  ctx.lineTo(w * 0.96, groundY + u * 13);
  ctx.stroke();
  ctx.setLineDash([]);
};

/* ── the timing dial: the human-timing engine, drawn as an instrument ── */

export const dialScene: SceneFn = (ctx, w, h, t) => {
  ctx.clearRect(0, 0, w, h);
  const u = Math.min(w, h) / 100;
  const { stroke, soft, accent, gold, faint } = INK;

  const cx = w / 2;
  const cy = h * 0.56;
  const R = Math.min(w, h) * 0.34;

  /* dial face */
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(1, u * 1.2);
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();

  /* tick marks — 30s to 90s window */
  for (let i = 0; i <= 12; i++) {
    const a = -Math.PI * 1.25 + (i / 12) * Math.PI * 1.5;
    const inner = i % 3 === 0 ? R * 0.82 : R * 0.9;
    ctx.strokeStyle = i % 3 === 0 ? soft : faint;
    ctx.lineWidth = Math.max(0.7, u * (i % 3 === 0 ? 0.9 : 0.5));
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * R * 0.98, cy + Math.sin(a) * R * 0.98);
    ctx.stroke();
  }

  /* the sweep needle — slow, deliberate, human */
  const sweep = -Math.PI * 1.25 + ((Math.sin(t * 0.00055) * 0.5 + 0.5) * Math.PI * 1.5);
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1, u * 1.1);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(sweep) * R * 0.8, cy + Math.sin(sweep) * R * 0.8);
  ctx.stroke();
  /* needle hub */
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.arc(cx, cy, u * 2.2, 0, Math.PI * 2);
  ctx.fill();

  /* glowing target zone — the sweet spot (30–45s) */
  ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 0.0018);
  ctx.strokeStyle = gold;
  ctx.lineWidth = Math.max(1.4, u * 1.6);
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.06, -Math.PI * 1.25, -Math.PI * 1.25 + Math.PI * 0.3);
  ctx.stroke();
  ctx.globalAlpha = 1;

  /* readout chips below — machine writing its own log */
  const chipW = w * 0.16;
  const chipY = cy + R * 1.32;
  ctx.strokeStyle = soft;
  ctx.lineWidth = Math.max(0.7, u * 0.6);
  for (let i = 0; i < 3; i++) {
    const x = cx - chipW * 1.62 + i * chipW * 1.12;
    rr(ctx, x, chipY, chipW, u * 6, u);
    ctx.stroke();
    /* blinking cursor inside first chip */
    if (i === 0 && Math.sin(t * 0.005) > 0) {
      ctx.fillStyle = soft;
      ctx.fillRect(x + u * 1.4, chipY + u * 2, u * 0.9, u * 2);
    }
    if (i === 2) {
      ctx.fillStyle = accent;
      ctx.fillRect(x + u * 1.4, chipY + u * 2.6, chipW * 0.52, u * 0.9);
    }
  }

  /* antenna spark — the webhook just fired */
  const sparkT = (t * 0.0004) % 1;
  if (sparkT < 0.12) {
    const a = -Math.PI / 2;
    ctx.globalAlpha = 1 - sparkT / 0.12;
    ctx.strokeStyle = gold;
    ctx.lineWidth = Math.max(0.8, u);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.lineTo(cx + Math.cos(a) * (R + u * 6), cy + Math.sin(a) * (R + u * 6));
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  /* antenna stub */
  ctx.strokeStyle = soft;
  ctx.lineWidth = Math.max(0.7, u * 0.6);
  ctx.beginPath();
  ctx.moveTo(cx, cy - R);
  ctx.lineTo(cx, cy - R - u * 3);
  ctx.stroke();
};

/* ── the orbit scene: a small planet keeping its moons — the RELO world ── */

export const orbitScene: SceneFn = (ctx, w, h, t) => {
  ctx.clearRect(0, 0, w, h);

  const u = Math.min(w, h) / 100;
  const { stroke, soft, accent, gold, faint } = INK;

  const cx = w / 2;
  const cy = h / 2;

  /* breathing aura behind the planet */
  const breathe = 0.5 + 0.5 * Math.sin(t * 0.0011);
  const auraR = w * (0.17 + breathe * 0.02);
  const grad = ctx.createRadialGradient(cx, cy, auraR * 0.1, cx, cy, auraR);
  grad.addColorStop(0, "rgba(255,40,0,0.5)");
  grad.addColorStop(1, "rgba(255,40,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  /* the planet — ringed, half-lit */
  const R = w * 0.11;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(1, u * 1.2);
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();

  /* latitude bands */
  ctx.strokeStyle = faint;
  for (let i = 1; i <= 3; i++) {
    const yy = cy - R + (i * R) / 2;
    const half = Math.sqrt(Math.max(0, R * R - (yy - cy) * (yy - cy)));
    ctx.beginPath();
    ctx.moveTo(cx - half, yy);
    ctx.lineTo(cx + half, yy);
    ctx.stroke();
  }

  /* ring of the planet — moon-gold */
  ctx.strokeStyle = gold;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.35);
  ctx.beginPath();
  ctx.ellipse(0, 0, R * 1.75, R * 0.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  /* three moons on tilted orbits */
  for (let i = 0; i < 3; i++) {
    const a = t * (0.0004 + i * 0.00025) + (i * Math.PI * 2) / 3;
    const orbR = w * (0.24 + i * 0.09);
    const tilt = 0.5 + i * 0.18;
    const mx = cx + Math.cos(a) * orbR;
    const my = cy + Math.sin(a) * orbR * tilt;

    /* orbit path — barely there */
    ctx.strokeStyle = faint;
    ctx.lineWidth = Math.max(0.6, u * 0.5);
    ctx.beginPath();
    ctx.ellipse(cx, cy, orbR, orbR * tilt, 0, 0, Math.PI * 2);
    ctx.stroke();

    /* moon — front half passes over the planet, back half behind */
    const front = Math.sin(a) > 0;
    if (!front) {
      ctx.fillStyle = soft;
      ctx.beginPath();
      ctx.arc(mx, my, u * (1.4 + i * 0.4), 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    if (i === 0) {
      ctx.fillStyle = accent;
    } else {
      ctx.fillStyle = i === 1 ? soft : stroke;
    }
    ctx.beginPath();
    ctx.arc(mx, my, u * (1.5 + i * 0.45), 0, Math.PI * 2);
    ctx.fill();

    /* comet tail */
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = i === 0 ? accent : soft;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(mx - Math.cos(a) * u * 6, my - Math.sin(a) * u * 6 * tilt);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /* constellation dust */
  for (let i = 0; i < 9; i++) {
    const sx = ((i * 137) % 100) / 100 * w;
    const sy = ((i * 61) % 100) / 100 * h;
    const s = 0.5 + 0.5 * Math.sin(t * 0.002 + i * 1.7);
    ctx.globalAlpha = 0.15 + s * 0.5;
    ctx.fillStyle = i % 3 ? soft : stroke;
    ctx.fillRect(sx, sy, u * 0.9, u * 0.9);
  }
  ctx.globalAlpha = 1;
};

export interface AsciiPalette {
  /** colour for the dimmest visible glyphs */
  dim: string;
  /** mid brightness */
  mid: string;
  /** brightest glyphs */
  hot: string;
  /** accent glyphs — scene marks these with red-dominant pixels */
  accent: string;
  /** moon-gold glyphs — scene marks these with warm-gold pixels */
  gold: string;
  /** canvas background */
  bg?: string;
}

const DEFAULT_PALETTE: AsciiPalette = {
  dim: "#4c4763",
  mid: "#8d87ab",
  hot: "#efedfa",
  accent: "#a99dff",
  gold: "#f2c48d",
  bg: "#0a0912",
};

/* daybreak palette — the same plates, printed in ink on paper */
const DAY_PALETTE: AsciiPalette = {
  dim: "#c9c2b2",
  mid: "#7a7392",
  hot: "#2a2440",
  accent: "#5648cf",
  gold: "#a06a15",
  bg: "#fbf8f1",
};

/* ── tiny drawing helpers for scene authors ──────────────────────────── */

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function strokeFill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  stroke: string,
  fill?: string,
  lw = 1
) {
  rr(ctx, x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

/* ── the hero scene: phone running a RELO automation ─────────────────── */

export const phoneScene: SceneFn = (ctx, w, h, t) => {
  ctx.clearRect(0, 0, w, h);

  const u = Math.min(w, h) / 100; // one unit ≈ 1% of the smaller side
  const { stroke, soft, accent, gold, faint } = INK;

  /* floating comment chips (left side) */
  const chip = (cx: number, cy: number, ww: number, hh: number, glow: number) => {
    ctx.globalAlpha = 0.55 + glow * 0.45;
    strokeFill(ctx, cx, cy, ww, hh, hh / 2, soft, undefined, Math.max(0.6, u * 0.5));
    ctx.globalAlpha = 1;
  };
  const pulse = 0.5 + 0.5 * Math.sin(t * 0.0016);
  chip(w * 0.02, h * 0.16, w * 0.17, h * 0.045, pulse);
  chip(w * 0.04, h * 0.26, w * 0.13, h * 0.04, 1 - pulse);
  chip(w * 0.01, h * 0.37, w * 0.15, h * 0.04, pulse * 0.7);

  /* phone body */
  const pw = w * 0.44;
  const ph = h * 0.86;
  const px = (w - pw) / 2 + Math.sin(t * 0.0007) * u * 1.2;
  const py = (h - ph) / 2;
  strokeFill(ctx, px, py, pw, ph, u * 7, stroke, undefined, Math.max(1, u * 1.1));

  /* header */
  ctx.fillStyle = soft;
  ctx.beginPath();
  ctx.arc(px + pw * 0.14, py + ph * 0.07, u * 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = faint;
  rr(ctx, px + pw * 0.24, py + ph * 0.055, pw * 0.3, u * 1.4, u);
  ctx.fill();
  rr(ctx, px + pw * 0.24, py + ph * 0.09, pw * 0.2, u * 1.1, u);
  ctx.fill();
  /* status dots */
  ctx.fillStyle = soft;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(px + pw * 0.82 + i * u * 1.6, py + ph * 0.07, u * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  /* incoming comment bubble */
  const cbY = py + ph * 0.15;
  strokeFill(
    ctx,
    px + pw * 0.06,
    cbY,
    pw * 0.62,
    ph * 0.075,
    u * 2.2,
    soft,
    undefined,
    Math.max(0.7, u * 0.6)
  );
  ctx.fillStyle = soft;
  for (let i = 0; i < 3; i++) {
    /* typing dots */
    const bob = Math.sin(t * 0.004 + i * 1.1) * 0.5 + 0.5;
    ctx.globalAlpha = 0.5 + bob * 0.5;
    ctx.beginPath();
    ctx.arc(
      px + pw * 0.13 + i * u * 2.4,
      cbY + ph * 0.0375,
      u * 0.8,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  /* keyword lock-on tag */
  ctx.fillStyle = accent;
  rr(ctx, px + pw * 0.06, cbY + ph * 0.095, pw * 0.34, ph * 0.035, u);
  ctx.fill();

  /* the DM card */
  const cardY = py + ph * 0.33;
  strokeFill(
    ctx,
    px + pw * 0.06,
    cardY,
    pw * 0.88,
    ph * 0.42,
    u * 3,
    stroke,
    undefined,
    Math.max(0.9, u * 0.7)
  );
  /* card image area */
  strokeFill(
    ctx,
    px + pw * 0.1,
    cardY + ph * 0.02,
    pw * 0.8,
    ph * 0.14,
    u * 1.5,
    faint
  );
  ctx.fillStyle = soft;
  rr(ctx, px + pw * 0.1, cardY + ph * 0.185, pw * 0.55, u * 1.5, u);
  ctx.fill();
  rr(ctx, px + pw * 0.1, cardY + ph * 0.215, pw * 0.4, u * 1.1, u);
  ctx.fill();
  /* three buttons — accent so they burn iris */
  for (let i = 0; i < 3; i++) {
    const by = cardY + ph * 0.26 + i * ph * 0.05;
    ctx.fillStyle = accent;
    rr(ctx, px + pw * 0.1, by, pw * 0.8, ph * 0.038, u);
    ctx.fill();
  }

  /* delivered tick + progress sweep under the card */
  ctx.fillStyle = gold;
  rr(ctx, px + pw * 0.66, py + ph * 0.79, pw * 0.22, ph * 0.03, u);
  ctx.fill();

  /* radar sweep — a line travelling down the phone, the machine breathing */
  const sweep = ((t * 0.00012) % 1);
  const sy = py + sweep * ph;
  ctx.globalAlpha = 0.5 * Math.sin(sweep * Math.PI);
  ctx.strokeStyle = soft;
  ctx.lineWidth = Math.max(0.7, u * 0.55);
  ctx.beginPath();
  ctx.moveTo(px + u * 2, sy);
  ctx.lineTo(px + pw - u * 2, sy);
  ctx.stroke();
  ctx.globalAlpha = 1;

  /* flying lead chip (right side, drifting upward with a fading trail) */
  const fly = (t * 0.02) % 1;
  const fx = w * 0.82 + Math.sin(fly * Math.PI) * w * 0.02;
  const fy = h * 0.78 - fly * h * 0.5;
  for (let k = 0; k < 4; k++) {
    const trail = fly - k * 0.045;
    if (trail < 0) continue;
    const tx = w * 0.82 + Math.sin(trail * Math.PI) * w * 0.02;
    const ty = h * 0.78 - trail * h * 0.5;
    ctx.globalAlpha = Math.sin(trail * Math.PI) * (1 - k * 0.24);
    strokeFill(ctx, tx, ty, w * 0.14, h * 0.04, h * 0.02, k === 0 ? accent : gold, undefined, Math.max(0.8, u * 0.6));
  }
  ctx.globalAlpha = 1;

  /* orbiting sparkles */
  for (let i = 0; i < 5; i++) {
    const a = t * 0.0006 + (i * Math.PI * 2) / 5;
    const sx = w / 2 + Math.cos(a) * w * 0.46;
    const sy2 = h / 2 + Math.sin(a * 1.3) * h * 0.44;
    const s = 0.5 + 0.5 * Math.sin(t * 0.003 + i * 2);
    ctx.globalAlpha = 0.25 + s * 0.75;
    ctx.fillStyle = i % 2 ? soft : stroke;
    ctx.fillRect(sx, sy2, u * 1.1, u * 1.1);
  }
  ctx.globalAlpha = 1;
};

/* ── wordmark scene: any text as ASCII ───────────────────────────────── */

export function textScene(text: string, weight = 800): SceneFn {
  return (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#f2f0fb";
    const size = Math.min(h * 1.15, (w / Math.max(1, text.length)) * 1.55);
    ctx.font = `${weight} ${size}px "Bricolage Grotesque", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, h * 0.54);
  };
}

/* ── the component ───────────────────────────────────────────────────── */

interface AsciiArtProps {
  scene: SceneFn;
  /** grid columns (character cells) */
  cols?: number;
  /** height / width ratio of the whole piece */
  aspect?: number;
  ramp?: string;
  palette?: AsciiPalette;
  /** css font-size of one glyph cell */
  fontSize?: number;
  interactive?: boolean;
  /** 0–1 — how strongly the piece dissolves into darkness at its edges */
  melt?: number;
  /** slow radar sweep line across the grid */
  sweep?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function AsciiArt({
  scene,
  cols = 96,
  aspect = 1.3,
  ramp = RAMPS.classic,
  palette,
  fontSize = 10,
  interactive = true,
  melt = 0,
  sweep = false,
  className,
  ariaLabel = "ASCII artwork",
}: AsciiArtProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number; on: boolean }>({ x: -1e4, y: -1e4, on: false });
  const [ready, setReady] = useState(false);
  const { isDay } = useTheme();
  const pal = palette ?? (isDay ? DAY_PALETTE : DEFAULT_PALETTE);

  const rows = useMemo(() => Math.round(cols / aspect / 1.7), [cols, aspect]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cellW = fontSize * 0.62;
    const cellH = fontSize * 1.02;
    const W = Math.max(16, Math.round(cols));
    const H = Math.max(12, Math.round(rows));
    const dpr = Math.min(1.75, window.devicePixelRatio || 1);

    canvas.width = Math.round(W * cellW * dpr);
    canvas.height = Math.round(H * cellH * dpr);

    /* offscreen buffer — one pixel per cell */
    const buf = document.createElement("canvas");
    buf.width = W;
    buf.height = H;
    const bctx = buf.getContext("2d", { willReadFrequently: true });
    if (!bctx) return;

    let raf = 0;
    let lastDraw = 0;
    let mounted = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    ctx.font = `${fontSize}px "Space Mono", ui-monospace, monospace`;

    const paint = (t: number) => {
      /* 1. scene → buffer */
      bctx.clearRect(0, 0, W, H);
      scene(bctx, W, H, t);
      const img = bctx.getImageData(0, 0, W, H).data;

      /* 2. clear visible canvas */
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W * cellW, H * cellH);
      if (pal.bg) {
        ctx.fillStyle = pal.bg;
        ctx.fillRect(0, 0, W * cellW, H * cellH);
      }
      ctx.fillStyle = pal.dim;
      ctx.textBaseline = "top";

      const m = mouseRef.current;
      const mx = m.x / cellW;
      const my = m.y / cellH;

      /* 3. cells → glyphs */
      for (let y = 0; y < H; y++) {
        const rowScan = 0.5 + 0.5 * Math.sin(t * 0.0009 - y * 0.12);
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          const a = img[i + 3];
          if (a < 28) continue;
          const r = img[i];
          const g = img[i + 1];
          const b = img[i + 2];
          let lum = (0.35 * r + 0.5 * g + 0.15 * b) / 255;
          if (lum < 0.06) continue;

          /* edge melt — the piece dissolves into the dark instead of
             stopping at a hard frame; distance from centre → falloff */
          if (melt > 0) {
            const nx = (x / W - 0.5) * 2;
            const ny = (y / H - 0.5) * 2;
            const d = Math.max(Math.abs(nx), Math.abs(ny)); /* box falloff */
            const edge = 1 - smoothstep(1 - melt * 0.85, 1.02, d);
            if (edge <= 0.02) continue;
            lum *= edge;
          }

          /* cursor proximity resolves the piece */
          let boost = 0;
          if (m.on) {
            const dx = x - mx;
            const dy = y - my;
            const d2 = dx * dx + dy * dy;
            const R = 9;
            if (d2 < R * R) boost = 1 - Math.sqrt(d2) / R;
          }
          const shine = rowScan * 0.16;
          const v = Math.min(1, lum + boost * 0.85 + shine);

          /* char index */
          const idx = Math.min(ramp.length - 1, Math.max(1, Math.floor(v * ramp.length)));
          const ch = ramp[idx];

          /* colour — dual-accent detection */
          const isRedMarker = r > 120 && r > g * 1.6 && r > b * 1.6;
          const isGoldMarker =
            r > 170 && g > 120 && b < 160 && r > b * 1.35 && g > b * 1.1;
          let color: string;
          if (isRedMarker) {
            color = v > 0.72 ? pal.accent : pal.mid;
          } else if (isGoldMarker) {
            color = v > 0.6 ? pal.gold : pal.mid;
          } else if (v > 0.66) {
            color = boost > 0.25 ? pal.accent : pal.hot;
          } else if (v > 0.38) {
            color = pal.mid;
          } else {
            color = pal.dim;
          }

          /* perf: NO per-glyph shadowBlur. At these font sizes the halo was
             invisible-but-expensive — the single biggest hover-lag source.
             Bright glyphs already read as light against the dim field. */

          if (color !== ctx.fillStyle) ctx.fillStyle = color;
          ctx.fillText(ch, x * cellW, y * cellH);
        }
      }

      /* 4. radar sweep — a bright line travelling the grid */
      if (sweep) {
        const sp = (t * 0.0001) % 1;
        const sy = sp * H;
        const fade = Math.sin(sp * Math.PI);
        ctx.globalAlpha = 0.34 * fade;
        ctx.fillStyle = pal.accent;
        ctx.fillRect(0, sy * cellH, W * cellW, 1.5);
        ctx.globalAlpha = 0.1 * fade;
        ctx.fillRect(0, (sy - 2.2) * cellH, W * cellW, 2.2 * cellH);
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    };

    const loop = (t: number) => {
      if (!mounted) return;
      const m = mouseRef.current;
      /* hover 22fps → smooth resolve; idle 7fps → the piece still breathes,
         but the main thread stays free for everything else */
      const interval = m.on ? 46 : 140;
      if (t - lastDraw >= interval) {
        lastDraw = t;
        paint(t);
      }
      raf = requestAnimationFrame(loop);
    };

    const kick = () => {
      if (reduced) {
        paint(1200); /* one representative static frame */
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: ((e.clientX - rect.left) / rect.width) * (canvas.width / dpr),
        y: ((e.clientY - rect.top) / rect.height) * (canvas.height / dpr),
        on: true,
      };
    };
    const onLeave = () => {
      mouseRef.current = { x: -1e4, y: -1e4, on: false };
    };

    let fontTimer = 0;
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (mounted) setReady(true);
      });
    } else {
      fontTimer = window.setTimeout(() => setReady(true), 0);
    }

    if (interactive) {
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerleave", onLeave);
    }

    kick();

    return () => {
      mounted = false;
      window.clearTimeout(fontTimer);
      cancelAnimationFrame(raf);
      if (interactive) {
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerleave", onLeave);
      }
    };
  }, [scene, cols, rows, aspect, ramp, fontSize, pal, interactive, melt, sweep, ready, isDay]);

  const maxPxWidth = Math.round(cols * fontSize * 0.62);

  return (
    <canvas
      ref={canvasRef}
      aria-label={ariaLabel}
      role="img"
      className={interactive ? `${className ?? ""} ascii-live` : className}
      style={{
        width: "100%",
        height: "auto",
        maxWidth: maxPxWidth,
        display: "block",
      }}
    />
  );
}

/* smoothstep helper for the edge melt */
function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/* ── AsciiFrame — the observatory plate ────────────────────────────────
   Corner brackets, scanlines, a mono caption and a status dot. This is
   what turns a bare ASCII canvas into a finished exhibit — the piece is
   *presented*, like a specimen under glass. */

export function AsciiFrame({
  children,
  fig,
  caption,
  status,
  tone = "dark",
  className,
}: {
  children: React.ReactNode;
  /** e.g. "fig. 01" */
  fig?: string;
  caption?: string;
  /** mono status text, e.g. "● live" */
  status?: string;
  tone?: "dark" | "deep";
  className?: string;
}) {
  const corner = "absolute size-4 border-ember/60";
  return (
    <div
      className="scanlines relative overflow-hidden rounded-[22px] border border-line"
      style={{
        background: tone === "deep" ? "var(--plate-bg-deep)" : "var(--plate-bg)",
        boxShadow: "var(--shadow-lift), 0 0 60px -24px var(--ember-wash)",
      }}
    >
      {/* corner brackets — the plate is measured, catalogued, alive */}
      <span aria-hidden className={`${corner} left-3 top-3 border-l-2 border-t-2 rounded-tl-md`} />
      <span aria-hidden className={`${corner} right-3 top-3 border-r-2 border-t-2 rounded-tr-md`} />
      <span aria-hidden className={`${corner} bottom-3 left-3 border-b-2 border-l-2 rounded-bl-md`} />
      <span aria-hidden className={`${corner} bottom-3 right-3 border-b-2 border-r-2 rounded-br-md`} />
      {children}
      {(fig || caption || status) && (
        <div className="relative flex items-center gap-3 border-t border-line px-4 py-2.5">
          <span className="font-mono text-[9.5px] tracking-[0.24em] text-ember-hot uppercase tnum">{fig}</span>
          <span className="font-mono text-[9.5px] tracking-[0.18em] text-ink-3 uppercase">{caption}</span>
          {status && (
            <span className="ml-auto font-mono text-[9.5px] tracking-[0.18em] text-honey uppercase">{status}</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── decorative wordmark ─────────────────────────────────────────────── */

export function AsciiWordmark({
  text = "RELO",
  cols = 120,
  className,
  fontSize = 9,
  melt = 0,
  sweep = false,
}: {
  text?: string;
  cols?: number;
  className?: string;
  fontSize?: number;
  melt?: number;
  sweep?: boolean;
}) {
  const scene = useMemo(() => textScene(text), [text]);
  return (
    <AsciiArt
      scene={scene}
      cols={cols}
      aspect={text.length > 5 ? 4.6 : 3.4}
      ramp={RAMPS.soft}
      fontSize={fontSize}
      interactive
      melt={melt}
      sweep={sweep}
      className={className}
      ariaLabel={`${text} in ASCII`}
    />
  );
}

/* ── decorative divider strip ────────────────────────────────────────── */

export function AsciiStrip({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const chars = "░▒▓█▓▒░";
  return (
    <div aria-hidden className="ascii-divider" style={{ opacity: tone === "dark" ? 0.5 : 0.35 }}>
      {chars.repeat(24)}
    </div>
  );
}

/* ── AsciiRain — faint glyphs falling through the dark, like the room
      you're in has its own weather. Pure ambience, near-silent. ───────── */

const RAIN_GLYPHS = "01<>[]{}=+*·:;░▒╱╲╳ﮩ";

export function AsciiRain({
  density = 26,
  tone = "dark",
  opacity = 0.35,
  className,
}: {
  density?: number;
  tone?: "dark" | "light";
  opacity?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { isDay } = useTheme();

  const drops = useMemo(
    () =>
      Array.from({ length: density }, () => ({
        x: Math.random(),
        y: Math.random(),
        sp: 0.02 + Math.random() * 0.05,
        len: 3 + Math.floor(Math.random() * 8),
        ch: RAIN_GLYPHS[Math.floor(Math.random() * RAIN_GLYPHS.length)],
        drift: (Math.random() - 0.5) * 0.008,
      })),
    [density]
  );

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const fontSize = 11;
    const cellW = fontSize * 0.62;
    const cellH = fontSize * 1.05;
    const dpr = Math.min(1.25, window.devicePixelRatio || 1);
    let W = 0, H = 0;
    const resize = () => {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    ctx.font = `${fontSize}px "Space Mono", ui-monospace, monospace`;
    ctx.textBaseline = "top";

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.01 });
    io.observe(canvas);

    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || t - last < 90) return; /* 11fps — it's weather, not action */
      last = t;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const cols = Math.max(8, Math.floor(W / cellW));

      for (const d of drops) {
        d.y += d.sp / 100;
        d.x += d.drift / 100;
        if (d.y > 1.1) { d.y = -0.15; d.x = Math.random(); d.ch = RAIN_GLYPHS[Math.floor(Math.random() * RAIN_GLYPHS.length)]; }
        if (d.x > 1.02) d.x = -0.02;
        if (d.x < -0.02) d.x = 1.02;

        const col = Math.round(d.x * cols);
        const headY = d.y * H;

        for (let k = 0; k < d.len; k++) {
          const gy = headY - k * cellH;
          if (gy < -cellH || gy > H) continue;
          const fade = (1 - k / d.len) * 0.5;
          ctx.globalAlpha = fade * (tone === "dark" ? 1 : 0.8);
          ctx.fillStyle =
            k === 0
              ? isDay
                ? "rgba(86,72,207,0.8)"
                : tone === "dark"
                  ? "rgba(169,157,255,0.95)"
                  : "rgba(139,128,249,0.8)"
              : isDay
                ? "#9a93b5"
                : tone === "dark"
                  ? "#8d87ab"
                  : "#675f88";
          ctx.fillText(d.ch, col * cellW, gy);
        }
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [drops, tone, isDay]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity }}
    />
  );
}
