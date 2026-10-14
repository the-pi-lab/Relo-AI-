"use client";

/**
 * RELO WORLD — the ambient layer that turns a page into a place.
 *
 *  · ShaderCanvas  — hand-written GLSL: aurora curtains, deep nebula, liquid iris
 *  · Starfield     — three-depth stars that twinkle, drift, and occasionally fall
 *  · DustMotes     — three-depth drifting dust that leans toward the cursor
 *  · MouseParallax — depth-shifts children against the pointer
 *  · MoonPhases    — an eight-phase lunar strip, pure CSS
 *  · Preloader     — one breath before the world opens
 *
 * Everything here is ambience: slow, soft, spectral. No spinning 3D props.
 * Everything pauses when offscreen, honors reduced-motion, and degrades
 * to plain CSS light when WebGL is unavailable.
 */

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { AsciiArt, portalScene, RAMPS } from "./ascii";
import { useTheme } from "@/lib/relo/theme";

/* shared perf governor — ambience never needs more than this */
const AMBIENT_FPS = 24;
const AMBIENT_FRAME = 1000 / AMBIENT_FPS;
const AMBIENT_DPR = Math.min(1.25, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
/* low-powered devices get a quieter world automatically */
const LITE =
  typeof navigator !== "undefined" &&
  ((navigator.hardwareConcurrency ?? 8) <= 4 || (navigator as Navigator & { deviceMemory?: number }).deviceMemory !== undefined && (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 4);

const REDUCED = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ═══════════════════════════════════════════════════════════════════════
   SHADERS — small fragment programs, one quad, no geometry
   ═══════════════════════════════════════════════════════════════════════ */

const VERT = `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

/* aurora — spectral curtains woven from fbm light, swaying over the void.
      u_day flips the same sky to Daybreak: paper ground, deepened ink washes. */
const FRAG_AURORA = `
precision mediump float;
uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_day;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 st = uv; st.x *= u_res.x / u_res.y;

  float t = u_time * 0.04;
  vec2 drift = vec2(t * 0.55, -t * 0.22);

  /* two interwoven flow fields weave the curtains */
  vec2 q = vec2(fbm(st * 1.5 + drift), fbm(st * 1.5 - drift + 4.7));
  float f = fbm(st * 2.0 + q * 1.5 + drift * 1.3);

  /* the curtains lean toward your hand */
  vec2 m = u_mouse;
  m.x *= u_res.x / u_res.y;
  float md = length(st - m);
  float lift = exp(-md * 2.4) * 0.26;
  f = f + lift;

  /* spectral palette over the void — the same light, day or night */
  vec3 base  = mix(vec3(0.051, 0.043, 0.086), vec3(0.957, 0.945, 0.914), u_day);
  vec3 iris  = mix(vec3(0.545, 0.502, 0.976), vec3(0.435, 0.380, 0.918), u_day);
  vec3 mint  = mix(vec3(0.388, 0.867, 0.714), vec3(0.090, 0.561, 0.410), u_day);
  vec3 moon  = mix(vec3(0.949, 0.769, 0.553), vec3(0.690, 0.466, 0.120), u_day);
  vec3 rose  = mix(vec3(0.937, 0.576, 0.729), vec3(0.831, 0.329, 0.541), u_day);
  float amt  = mix(1.0, 0.58, u_day);

  vec3 col = base;
  col = mix(col, iris,  smoothstep(0.34, 0.78, f) * 0.42 * amt);
  col = mix(col, mint,  smoothstep(0.55, 0.95, f) * 0.20 * amt);
  col = mix(col, moon,  smoothstep(0.70, 1.08, f) * 0.22 * amt);
  col = mix(col, rose,  smoothstep(0.80, 1.18, f) * 0.14 * amt);

  /* settle into the page toward the edges and the top */
  float vig = smoothstep(1.3, 0.28, length(uv - vec2(0.5, 0.44)));
  col = mix(base, col, vig * 0.92);
  col = mix(col, base, smoothstep(0.62, 1.05, uv.y) * 0.6);

  gl_FragColor = vec4(col, 1.0);
}
`;

/* nebula — a deep-void nebula, lit from below by a buried iris core.
      In day the core becomes an ink-wash sunken into warm paper. */
const FRAG_NEBULA = `
precision mediump float;
uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_day;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.02 + vec2(3.1, 7.7); a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 st = uv; st.x *= u_res.x / u_res.y;

  float t = u_time * 0.028;
  vec2 q = vec2(fbm(st * 1.35 + vec2(t * 0.5, 0.0)), fbm(st * 1.35 - vec2(0.0, t * 0.34) + 2.9));
  float f = fbm(st * 1.85 + q * 1.6);

  /* buried core — lower middle, breathes toward the cursor */
  vec2 m = u_mouse * 0.35;
  vec2 core = vec2(0.5 + m.x * 0.2, 0.15 + m.y * 0.1);
  core.x *= u_res.x / u_res.y;
  float sd = length(st - core);
  float glow = exp(-sd * 2.1) * 0.95 + exp(-sd * 0.85) * 0.4;

  vec3 base  = mix(vec3(0.031, 0.027, 0.055), vec3(0.957, 0.945, 0.914), u_day);
  vec3 iris  = mix(vec3(0.545, 0.502, 0.976), vec3(0.435, 0.380, 0.918), u_day);
  vec3 moon  = mix(vec3(0.949, 0.769, 0.553), vec3(0.690, 0.466, 0.120), u_day);
  vec3 mint  = mix(vec3(0.388, 0.867, 0.714), vec3(0.090, 0.561, 0.410), u_day);
  float amt  = mix(1.0, 0.55, u_day);

  vec3 col = base;
  col = mix(col, iris, smoothstep(0.30, 0.85, f) * 0.24 * amt);
  col = mix(col, moon, smoothstep(0.50, 1.00, f) * 0.16 * amt);
  col = mix(col, mint, smoothstep(0.68, 1.15, f) * 0.10 * amt);
  if (u_day > 0.5) {
    col = mix(col, iris, glow * 0.26);
    col = mix(col, moon, glow * glow * 0.12);
  } else {
    col += iris * glow * 0.42 * (0.7 + 0.3 * f);
    col += moon * glow * glow * 0.16;
  }

  /* sink into the ground at the edges */
  float edge = smoothstep(1.35, 0.30, length(uv - vec2(0.5, 0.45))) * 0.78 + 0.22;
  col = mix(base, col, edge);

  gl_FragColor = vec4(col, 1.0);
}
`;

/* iris — one slow liquid orb of spectral light, wandering the frame.
      Day turns it into an ink-halo drifting over warm paper. */
const FRAG_IRIS = `
precision mediump float;
uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_day;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.05 + vec2(2.3, 6.1); a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 st = uv; st.x *= u_res.x / u_res.y;

  float t = u_time * 0.05;

  /* the orb wanders a lazy lissajous path, leaning toward the cursor */
  vec2 m = (u_mouse - 0.5) * 0.24;
  vec2 orb = vec2(
    0.5 + 0.22 * sin(t * 0.7) + m.x,
    0.48 + 0.16 * sin(t * 0.53 + 1.7) + m.y
  );
  orb.x *= u_res.x / u_res.y;

  float d = length(st - orb);
  float halo = exp(-d * 3.4);
  float body = exp(-d * 1.6) * 0.55;
  float wob = fbm(st * 3.0 + t * 0.4) * 0.35;

  vec3 base  = mix(vec3(0.051, 0.043, 0.086), vec3(0.957, 0.945, 0.914), u_day);
  vec3 iris  = mix(vec3(0.545, 0.502, 0.976), vec3(0.435, 0.380, 0.918), u_day);
  vec3 moon  = mix(vec3(0.949, 0.769, 0.553), vec3(0.690, 0.466, 0.120), u_day);
  vec3 mint  = mix(vec3(0.388, 0.867, 0.714), vec3(0.090, 0.561, 0.410), u_day);
  float amt  = mix(1.0, 0.55, u_day);

  vec3 col = base;
  col = mix(col, iris, clamp(body * amt + wob * 0.4 * amt, 0.0, 1.0));
  col = mix(col, moon, clamp(halo * 0.5 * amt, 0.0, 1.0));
  col = mix(col, mint, clamp(halo * body * 1.6, 0.0, 1.0) * 0.5 * amt);
  if (u_day > 0.5) {
    col = mix(col, iris, halo * 0.18);
  } else {
    col += iris * halo * 0.25;
  }

  /* the orb floats inside the room, not on top of a wallpaper */
  float edge = smoothstep(1.5, 0.35, length(uv - orb)) * 0.85 + 0.15;
  col = mix(base, col, edge);

  gl_FragColor = vec4(col, 1.0);
}
`;

export type ShaderKind = "aurora" | "nebula" | "iris";

const FRAGS: Record<ShaderKind, string> = {
  aurora: FRAG_AURORA,
  nebula: FRAG_NEBULA,
  iris: FRAG_IRIS,
};

/* ═══════════════════════════════════════════════════════════════════════
   ShaderCanvas
   ═══════════════════════════════════════════════════════════════════════ */

export function ShaderCanvas({
  kind = "aurora",
  className,
  opacity = 1,
}: {
  kind?: ShaderKind;
  className?: string;
  opacity?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ok, setOk] = useState(false);
  const { isDay } = useTheme();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (REDUCED()) { setOk(false); return; } /* static CSS fallback below */

    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGS[kind]);
    if (!vs || !fs) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    /* fullscreen triangle */
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uDay = gl.getUniformLocation(prog, "u_day");

    const dpr = AMBIENT_DPR;
    const resize = () => {
      const w = Math.max(2, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(2, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();

    /* smoothed pointer, normalised to shader space */
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width;
      mouse.ty = 1 - (e.clientY - r.top) / r.height;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), {
      threshold: 0.02,
    });
    io.observe(canvas);

    let raf = 0;
    let t0 = performance.now();
    let last = 0;
    const frame = LITE ? 1000 / 18 : AMBIENT_FRAME;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      if (now - last < frame) return;
      last = now;
      mouse.x += (mouse.tx - mouse.x) * 0.045;
      mouse.y += (mouse.ty - mouse.y) * 0.045;
      resize();
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (now - t0) * 0.001);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uDay, isDay ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(loop);

    setOk(true);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [kind, isDay]);

  return (
    <div className={className} aria-hidden style={{ position: "absolute", inset: 0, opacity }}>
      {/* CSS fallback — same world, no WebGL (reduced-motion / no-GPU days) */}
      <div
        className={
          kind === "aurora" ? "aurora-fallback" : kind === "nebula" ? "nebula-fallback" : "iris-fallback"
        }
        style={{ position: "absolute", inset: 0, display: ok ? "none" : "block" }}
      />
      <canvas
        key={isDay ? "sky-day" : "sky-night"}
        ref={ref}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: ok ? "block" : "none" }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Starfield — three depths of stars, twinkling; every so often one falls.
   ═══════════════════════════════════════════════════════════════════════ */

interface Star {
  x: number; y: number; z: number;
  r: number; ph: number; sp: number;
}
interface Comet {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
}

export function Starfield({
  density = 120,
  className,
  opacity = 1,
}: {
  density?: number;
  className?: string;
  opacity?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { isDay } = useTheme();

  const stars = useMemo<Star[]>(() => {
    const n = REDUCED() ? Math.min(40, density) : LITE ? Math.round(density * 0.55) : density;
    return Array.from({ length: n }, (_, i) => {
      const z = Math.pow((i % 8) / 7, 1.5); /* mostly far, few near */
      return {
        x: Math.random(),
        y: Math.random(),
        z,
        r: 0.4 + z * 1.5,
        ph: Math.random() * Math.PI * 2,
        sp: 0.5 + Math.random() * 1.4,
      };
    });
  }, [density]);

  useEffect(() => {
    if (REDUCED()) return; /* reduced motion — the CSS sky carries the ambience */
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = AMBIENT_DPR;
    let W = 0, H = 0;
    const resize = () => {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const onMove = (e: PointerEvent) => {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = e.clientY / window.innerHeight;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), {
      threshold: 0.01,
    });
    io.observe(canvas);

    /* shooting stars — rare, quiet, unforgettable */
    const comets: Comet[] = [];
    let nextComet = performance.now() + 4000 + Math.random() * 6000;

    /* day: the same stars, drawn in ink on paper — the universe keeps
       its sky, just etched instead of lit */
    const TONES = isDay
      ? [
          "38,32,56",    /* ink */
          "111,97,234",  /* deep iris */
          "176,119,31",  /* deep amber */
        ]
      : [
          "242,240,251", /* bone */
          "169,157,255", /* iris */
          "242,196,141", /* moon-gold */
        ];
    const dayDim = isDay ? 0.5 : 1;

    let raf = 0;
    let last = 0;
    const frame = LITE ? 1000 / 18 : AMBIENT_FRAME;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || now - last < frame) return;
      last = now;
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      /* stars */
      for (const s of stars) {
        const px = (mouse.x - 0.5) * (s.z * 30);
        const py = (mouse.y - 0.5) * (s.z * 20);
        const tw = 0.5 + 0.5 * Math.sin(now * 0.001 * s.sp + s.ph);
        const alpha = (0.18 + s.z * 0.6) * (0.45 + tw * 0.55) * dayDim;

        ctx.beginPath();
        ctx.arc(s.x * W + px, s.y * H + py, s.r * (0.85 + tw * 0.3), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${TONES[s.z > 0.7 ? (s.ph > 4.7 ? 2 : 1) : 0]},${alpha})`;
        ctx.fill();
      }

      /* comets */
      if (now > nextComet && !REDUCED()) {
        nextComet = now + 7000 + Math.random() * 9000;
        const fromLeft = Math.random() > 0.5;
        comets.push({
          x: fromLeft ? -0.05 : 1.05,
          y: Math.random() * 0.3,
          vx: (fromLeft ? 1 : -1) * (0.22 + Math.random() * 0.12),
          vy: 0.1 + Math.random() * 0.08,
          life: 0,
          maxLife: 1.6 + Math.random() * 0.8,
        });
      }
      for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i];
        c.life += 0.016;
        c.x += c.vx * 0.016;
        c.y += c.vy * 0.016;
        const p = c.life / c.maxLife;
        if (p >= 1) { comets.splice(i, 1); continue; }
        const fade = Math.sin(p * Math.PI);
        const tail = 90 * fade;
        const grad = ctx.createLinearGradient(
          c.x * W, c.y * H,
          c.x * W - c.vx * W * 0.12, c.y * H - c.vy * H * 0.12
        );
        if (isDay) {
          grad.addColorStop(0, `rgba(38,32,56,${0.6 * fade})`);
          grad.addColorStop(0.3, `rgba(111,97,234,${0.34 * fade})`);
          grad.addColorStop(1, "rgba(111,97,234,0)");
        } else {
          grad.addColorStop(0, `rgba(242,240,251,${0.85 * fade})`);
          grad.addColorStop(0.3, `rgba(169,157,255,${0.4 * fade})`);
          grad.addColorStop(1, "rgba(169,157,255,0)");
        }
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(c.x * W, c.y * H);
        ctx.lineTo(c.x * W - c.vx * W * 0.12 - tail * 0.4, c.y * H - c.vy * H * 0.12 - tail * 0.4);
        ctx.stroke();
        /* the head */
        ctx.beginPath();
        ctx.arc(c.x * W, c.y * H, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = isDay
          ? `rgba(38,32,56,${0.7 * fade})`
          : `rgba(242,240,251,${0.9 * fade})`;
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [stars, isDay]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   DustMotes — parallax dust. Three depths, spectral light, slow air.
   ═══════════════════════════════════════════════════════════════════════ */

interface Mote {
  x: number; y: number; z: number; /* z: 0 far → 1 near */
  r: number; vx: number; vy: number; ph: number;
}

export function DustMotes({
  density = 46,
  tone = "iris",
  className,
  opacity = 1,
}: {
  density?: number;
  tone?: "iris" | "bone";
  className?: string;
  opacity?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { isDay } = useTheme();

  const motes = useMemo<Mote[]>(() => {
    const n = REDUCED() ? Math.min(18, density) : LITE ? Math.round(density * 0.5) : density;
    return Array.from({ length: n }, (_, i) => {
      const z = Math.pow((i % 7) / 6, 1.4); /* clustered far, few near */
      return {
        x: Math.random(),
        y: Math.random(),
        z,
        r: 0.5 + z * 1.7,
        vx: (Math.random() - 0.5) * 0.00004 * (0.3 + z),
        vy: -(0.00006 + Math.random() * 0.00012) * (0.3 + z),
        ph: Math.random() * Math.PI * 2,
      };
    });
  }, [density]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = AMBIENT_DPR;
    let W = 0, H = 0;
    const resize = () => {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const onMove = (e: PointerEvent) => {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = e.clientY / window.innerHeight;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), {
      threshold: 0.01,
    });
    io.observe(canvas);

    const colors =
      isDay
        ? ["rgba(38,32,56,0.30)", "rgba(111,97,234,0.26)", "rgba(176,119,31,0.24)"]
        : tone === "bone"
          ? ["rgba(242,240,251,0.5)", "rgba(169,157,255,0.45)", "rgba(242,196,141,0.42)"]
          : ["rgba(169,157,255,0.5)", "rgba(242,196,141,0.42)", "rgba(99,221,182,0.4)"];

    let raf = 0;
    let last = 0;
    const frame = LITE ? 1000 / 18 : AMBIENT_FRAME;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || now - last < frame) return;
      last = now;
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      for (const m of motes) {
        m.x += m.vx; m.y += m.vy;
        if (m.y < -0.04) { m.y = 1.04; m.x = Math.random(); }
        if (m.x < -0.04) m.x = 1.04;
        if (m.x > 1.04) m.x = -0.04;

        /* depth parallax against the cursor */
        const px = (mouse.x - 0.5) * (m.z * 26);
        const py = (mouse.y - 0.5) * (m.z * 18);

        const tw = 0.5 + 0.5 * Math.sin(now * 0.0012 * (0.6 + m.z) + m.ph);
        const alpha = (0.14 + m.z * 0.5) * (0.55 + tw * 0.45);

        ctx.beginPath();
        ctx.arc(m.x * W + px, m.y * H + py, m.r * (0.8 + tw * 0.35), 0, Math.PI * 2);
        ctx.fillStyle = colors[m.z > 0.66 ? 1 : m.z > 0.33 ? 0 : 2];
        ctx.globalAlpha = alpha;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [motes, tone, isDay]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MouseParallax — depth against the pointer, springed
   ═══════════════════════════════════════════════════════════════════════ */

export function MouseParallax({
  children,
  depth = 20,
  className,
}: {
  children: ReactNode;
  depth?: number;
  className?: string;
}) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 60, damping: 20, mass: 0.8 });
  const y = useSpring(my, { stiffness: 60, damping: 20, mass: 0.8 });

  useEffect(() => {
    if (REDUCED()) return;
    const move = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * depth * 2);
      my.set((e.clientY / window.innerHeight - 0.5) * depth * 2);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [mx, my, depth]);

  return (
    <motion.div className={className} style={{ x, y }}>
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MoonPhases — an eight-phase lunar strip. The calendar of this world.
   ═══════════════════════════════════════════════════════════════════════ */

export function MoonPhases({
  active,
  className,
}: {
  /** index of the currently lit moon, if any */
  active?: number;
  className?: string;
}) {
  /* phase: 0 new → 4 full → 7 waning crescent (lit fraction from the right) */
  const phases = [0, 0.25, 0.5, 0.75, 1, 0.75, 0.5, 0.25];
  return (
    <div aria-hidden className={`flex items-center gap-3 ${className ?? ""}`}>
      {phases.map((lit, i) => (
        <span
          key={i}
          className="relative inline-block size-2.5 rounded-full"
          style={{
            background:
              i === active
                ? "var(--honey)"
                : "var(--line-strong)",
            boxShadow:
              i === active
                ? "0 0 12px rgba(242,196,141,0.45)"
                : "none",
          }}
        >
          {lit > 0 && lit < 1 && (
            <span
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: i === active ? "var(--honey)" : "var(--ink-4)",
                clipPath:
                  i < 4
                    ? `inset(0 ${100 - lit * 100}% 0 0 round 999px)`
                    : `inset(0 0 0 ${(1 - lit) * 100}% round 999px)`,
              }}
            />
          )}
        </span>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Preloader — one breath before the world opens.
   A portal resolves out of glyphs; the wordmark seals you in.
   ═══════════════════════════════════════════════════════════════════════ */

const BOOT_LINES = [
  "warming the void",
  "hanging the aurora",
  "seeding the dust",
  "opening the door",
];

export function Preloader({ onDone }: { onDone?: () => void }) {
  const [gone, setGone] = useState(false);
  const [pct, setPct] = useState(0);
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (REDUCED()) {
      const id = window.setTimeout(() => {
        setGone(true);
        onDone?.();
      }, 0);
      return () => window.clearTimeout(id);
    }
    let raf = 0;
    const t0 = performance.now();
    const DUR = 2100;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / DUR);
      const eased = 1 - Math.pow(1 - p, 3);
      setPct(Math.round(eased * 100));
      setLine(Math.min(BOOT_LINES.length - 1, Math.floor(p * BOOT_LINES.length)));
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setGone(true);
        onDone?.();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  if (gone) return null;

  const glyphs = "▚▞▟▙▛▜░▒▓█·:;";

  return (
    <motion.div
      aria-hidden
      className="fixed inset-0 z-[100] grid place-items-center bg-night"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="nebula-fallback absolute inset-0" />
      <DustMotes density={26} tone="bone" opacity={0.5} />
      <div className="relative flex flex-col items-center gap-6">
        {/* the door — a portal drawn in glyphs */}
        <div className="w-[230px] opacity-90">
          <AsciiArt
            scene={portalScene}
            cols={64}
            aspect={0.72}
            ramp={RAMPS.classic}
            fontSize={6.5}
            melt={0.18}
            ariaLabel="A glowing portal, drawn in ASCII"
          />
        </div>
        <GlyphResolve text="RELO" glyphs={glyphs} />
        <div className="h-px w-44 overflow-hidden bg-ink/10">
          <motion.div
            className="h-full bg-gradient-to-r from-ember to-honey"
            style={{ width: `${pct}%` }}
            transition={{ ease: "linear" }}
          />
        </div>
        <div className="flex items-baseline gap-3 font-mono text-[10px] tracking-[0.3em] text-bone-dim uppercase">
          <span>{BOOT_LINES[line]}</span>
          <span className="text-ember-hot">{String(pct).padStart(3, "0")}</span>
        </div>
      </div>
    </motion.div>
  );
}

/* glyph scramble that resolves left→right — the door into the world */
function GlyphResolve({ text, glyphs }: { text: string; glyphs: string }) {
  const [out, setOut] = useState(() => text.split("").map(() => "?"));
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const DUR = 1500;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / DUR);
      setOut(
        text.split("").map((ch, i) => {
          const thresh = (i + 1) / text.length - 0.12;
          if (p >= thresh) return ch;
          return glyphs[Math.floor(Math.random() * glyphs.length)];
        })
      );
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, glyphs]);

  return (
    <p
      className="font-display text-6xl font-extrabold tracking-tight text-bone sm:text-7xl"
      style={{ fontVariantNumeric: "tabular-nums", textShadow: "0 0 34px rgba(139,128,249,0.5)" }}
    >
      {out.map((c, i) => (
        <span key={i} className={c === text[i] ? "" : "text-ember/70"}>
          {c}
        </span>
      ))}
    </p>
  );
}
