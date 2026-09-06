import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { CameraRig } from "./CameraRig";
import { getScrollProgress, updateGlobalScroll } from "./scrollStore";
import { actWeights } from "./timeline";
import {
  CrystalFinale,
  DataDust,
  DMCorridor,
  EngineCore,
  GlassSignal,
} from "./actors";

// Re-exported so the GSAP scrub driver keeps working unchanged.
export { updateGlobalScroll };

/**
 * LAYER 6 — Lighting/environment system: a dark studio.
 * Procedural image-based lighting (Lightformers — zero network fetches)
 * gives chrome and glass their realistic reflections; key/rim/fill
 * crossfade per act weights; fog swallows the void.
 */
function LightingRig() {
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const under = useRef<THREE.PointLight>(null);
  const tmp = useMemo(() => new THREE.Color(), []);
  const cKey = useMemo(() => new THREE.Color("#ffffff"), []);
  const cMist = useMemo(() => new THREE.Color("#bae6fd"), []);
  const cAmber = useMemo(() => new THREE.Color("#fcd34d"), []);
  const cEmerald = useMemo(() => new THREE.Color("#6ee7b7"), []);

  useFrame(() => {
    const [, w2, w3, w4] = actWeights(getScrollProgress());
    tmp.copy(cKey).lerp(cMist, w2 * 0.6).lerp(cAmber, w3 * 0.5).lerp(cEmerald, w4 * 0.6);
    if (key.current) {
      key.current.color.copy(tmp);
      key.current.intensity = 2.6 + w3 * 0.6 + w4 * 0.4;
    }
    if (rim.current) {
      rim.current.color.copy(tmp).lerp(cMist, 0.4);
      rim.current.intensity = 1.8 + w2 * 0.6;
    }
    if (under.current) under.current.intensity = 1.0 + w4 * 1.6;
  });

  return (
    <>
      <ambientLight intensity={1.6} />
      <directionalLight ref={key} position={[6, 9, 5]} intensity={2.6} color="#ffffff" />
      <directionalLight ref={rim} position={[-6, -3, 4]} intensity={1.8} color="#bae6fd" />
      <pointLight ref={under} position={[0, -3, 2]} intensity={1.0} color="#7dd3fc" />
    </>
  );
}

function Stage({ lowPower, glass }: { lowPower: boolean; glass: boolean }) {
  return (
    <group>
      <fog attach="fog" args={["#eef3f9", 9, 18]} />
      <LightingRig />
      {/* Procedural studio IBL — chrome/glass reflections, no HDR download. */}
      <Environment resolution={lowPower ? 128 : 256}>
        <Lightformer intensity={3} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} color="#e0f2fe" />
        <Lightformer intensity={1.5} position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} color="#38bdf8" />
        <Lightformer intensity={1.5} position={[5, 1, -1]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} color="#34d399" />
        <Lightformer intensity={0.6} position={[0, -4, 4]} scale={[10, 4, 1]} color="#0ea5e9" />
      </Environment>
      <DataDust count={lowPower ? 120 : 380} />
      <GlassSignal glass={glass} />
      <EngineCore glass={glass} />
      <DMCorridor glass={glass} />
      <CrystalFinale glass={glass} />
    </group>
  );
}

/**
 * LAYER 1+3 — DOM/UI mount + Three.js scene (dark cinematic world).
 * Fallbacks: reduced-motion → static poster; touch → low power
 * (fewer particles, simpler glass, lower DPR, no parallax).
 */
export function CinematicCanvas() {
  const reduceMotion = useReducedMotion();
  const lowPower = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
  }, []);

  if (reduceMotion) {
    return (
      <div
        aria-hidden
        className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,#e0f2fe_0%,#eef3f9_70%)]"
      />
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[#eef3f9]">
      <Canvas
        camera={{ position: [0, 0.3, 7.2], fov: 42 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        dpr={lowPower ? [1, 1.5] : [1, 1.75]}
      >
        <color attach="background" args={["#eef3f9"]} />
        <CameraRig allowParallax={!lowPower} />
        <Stage lowPower={lowPower} glass={!lowPower} />
      </Canvas>
    </div>
  );
}
