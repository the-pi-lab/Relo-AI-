import { useMemo, useRef, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { motion, useReducedMotion, useScroll, useMotionValueEvent } from "framer-motion";
import * as THREE from "three";
import { DataDust } from "../3d/actors";

export type ProgressRef = import("react").RefObject<number>;

/**
 * Shared hero infrastructure for landing sub-pages. Each hero owns an
 * 85vh section; scroll progress across it (0→1, scrubbable) drives the
 * variant scene. Reduced-motion renders the copy over a calm gradient.
 */
export function HeroCanvas({
  eyebrow,
  title,
  description,
  cta,
  scene,
  align = "center",
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  cta?: ReactNode;
  scene: (p: ProgressRef) => ReactNode;
  align?: "center" | "left";
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const reduceMotion = useReducedMotion();
  const lowPower = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
  }, []);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    progress.current = v;
  });

  return (
    <section ref={sectionRef} className="relative h-[88vh] min-h-[620px] overflow-hidden bg-[#eef3f9]">
      {!reduceMotion && (
        <div className="absolute inset-0">
          <Canvas
            camera={{ position: [0, 0.4, 7], fov: 42 }}
            gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
            dpr={lowPower ? [1, 1.5] : [1, 1.75]}
          >
            <color attach="background" args={["#eef3f9"]} />
            <fog attach="fog" args={["#eef3f9", 10, 20]} />
            <ambientLight intensity={1.6} />
            <directionalLight position={[6, 9, 5]} intensity={2.6} color="#ffffff" />
            <directionalLight position={[-6, -3, 4]} intensity={1.6} color="#bae6fd" />
            <Environment resolution={lowPower ? 128 : 256}>
              <Lightformer intensity={3} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} color="#e0f2fe" />
              <Lightformer intensity={1.5} position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} color="#7dd3fc" />
              <Lightformer intensity={1.5} position={[5, 1, -1]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} color="#6ee7b7" />
            </Environment>
            <DataDust count={lowPower ? 80 : 200} />
            {scene(progress)}
          </Canvas>
        </div>
      )}
      {reduceMotion && (
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#e0f2fe_0%,#eef3f9_70%)]" />
      )}

      <div
        className={`relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center pointer-events-none ${
          align === "center" ? "items-center text-center" : "items-start"
        }`}
      >
        <div className={`pointer-events-auto ${align === "center" ? "max-w-2xl" : "max-w-xl"}`}>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xs font-extrabold uppercase tracking-[0.2em] text-sky-700 mb-4"
          >
            {eyebrow}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.05] mb-5"
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="text-lg text-slate-600 font-medium leading-relaxed mb-8"
          >
            {description}
          </motion.p>
          {cta}
        </div>
      </div>
    </section>
  );
}


