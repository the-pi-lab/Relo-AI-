import * as THREE from "three";

/**
 * LAYER 2 — Scroll/timeline controller.
 *
 * Single source of truth: every animation state in the film is a pure
 * function of scroll progress p ∈ [0,1]. Scrubbing backward reverses the
 * film exactly (only sub-visual breathing uses the clock).
 */

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Smoothstep window: 0 before a, eased 0→1 across [a,b], 1 after. */
export function phase(p: number, a: number, b: number): number {
  const t = clamp01((p - a) / (b - a));
  return t * t * (3 - 2 * t);
}

export interface CamKey {
  p: number;
  pos: [number, number, number];
  look: [number, number, number];
  fov: number;
}

/**
 * Cinematic flight plan. Catmull-Rom through these keys = one continuous
 * move: establishing wide → dolly-in → 120° orbit (tracking) → dive to
 * close-up → micro push-pull → crane-up wide → settling arc.
 */
const CAM_KEYS: CamKey[] = [
  { p: 0.0, pos: [0.0, 0.3, 7.2], look: [0.6, 0.0, 0], fov: 42 }, // establishing wide
  { p: 0.22, pos: [0.2, 0.1, 5.4], look: [0.8, 0.0, 0], fov: 41 }, // macro dolly-in
  { p: 0.38, pos: [-3.0, 0.6, 4.8], look: [-0.4, 0.0, 0], fov: 42 }, // orbit mid (tracking)
  { p: 0.52, pos: [-1.2, 0.2, 5.4], look: [-0.3, 0.0, 0], fov: 41 }, // orbit end
  { p: 0.66, pos: [0.8, 0.0, 4.0], look: [0.5, -0.1, 0], fov: 38 }, // corridor close-up
  { p: 0.8, pos: [0.6, 0.3, 4.8], look: [0.4, -0.2, 0], fov: 40 }, // slight pull
  { p: 0.9, pos: [0.0, 1.4, 6.6], look: [0.0, -0.3, 0], fov: 44 }, // crane-up wide
  { p: 1.0, pos: [0.8, 0.7, 5.8], look: [0.0, -0.3, 0], fov: 43 }, // settling arc
];

const posCurve = new THREE.CatmullRomCurve3(CAM_KEYS.map((k) => new THREE.Vector3(...k.pos)));
const lookCurve = new THREE.CatmullRomCurve3(CAM_KEYS.map((k) => new THREE.Vector3(...k.look)));

export interface CamSample {
  pos: THREE.Vector3;
  look: THREE.Vector3;
  fov: number;
}

const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();

export function sampleCamera(p: number, out: CamSample): CamSample {
  const t = clamp01(p);
  posCurve.getPoint(t, _pos);
  lookCurve.getPoint(t, _look);
  out.pos.copy(_pos);
  out.look.copy(_look);
  // Piecewise-linear fov across keys.
  let fov = CAM_KEYS[0].fov;
  for (let i = 1; i < CAM_KEYS.length; i++) {
    if (t <= CAM_KEYS[i].p) {
      const a = CAM_KEYS[i - 1];
      const b = CAM_KEYS[i];
      const local = (t - a.p) / Math.max(1e-5, b.p - a.p);
      fov = a.fov + (b.fov - a.fov) * local;
      break;
    }
    fov = CAM_KEYS[i].fov;
  }
  out.fov = fov;
  return out;
}

/** Act weights for lighting/environment crossfades. */
export function actWeights(p: number): [number, number, number, number] {
  const w1 = 1 - phase(p, 0.18, 0.3);
  const w2 = phase(p, 0.22, 0.34) * (1 - phase(p, 0.5, 0.6));
  const w3 = phase(p, 0.54, 0.64) * (1 - phase(p, 0.78, 0.86));
  const w4 = phase(p, 0.82, 0.92);
  return [w1, w2, w3, w4];
}
