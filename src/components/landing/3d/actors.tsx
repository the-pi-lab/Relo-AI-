import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { getScrollProgress } from "./scrollStore";
import { phase } from "./timeline";

/**
 * Fresh asset set "CHROME & GLASS" — nothing reused from the previous build.
 * A continuous film in four movements: Signal → Engine → Delivery → Ownership.
 * Every structural transform is f(scroll); only ±0.02 breathing reads clock.
 */

function breathe(clock: number, seed: number, amp = 0.02): number {
  return Math.sin(clock * 1.4 + seed) * amp;
}

type GlassOpts = { glass: boolean };

function glassProps(full: boolean, tint: string, thickness = 1) {
  return full
    ? {
        color: tint,
        roughness: 0.05,
        metalness: 0,
        transmission: 1,
        thickness,
        ior: 1.5,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
      }
    : {
        color: tint,
        roughness: 0.15,
        metalness: 0.1,
        transparent: true,
        opacity: 0.55,
        clearcoat: 1,
      };
}

/** One-draw-call particle field, drifting down the timeline. */
export function DataDust({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
      seeds[i] = Math.random() * Math.PI * 2;
    }
    return { positions, seeds };
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const p = getScrollProgress();
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const y0 = positions[i * 3 + 1];
      let y = y0 - p * 7 + Math.sin(state.clock.elapsedTime * 0.5 + seeds[i]) * 0.15;
      y = ((((y + 6) % 12) + 12) % 12) - 6;
      pos.setY(i, y);
      pos.setX(i, positions[i * 3] + Math.cos(state.clock.elapsedTime * 0.4 + seeds[i]) * 0.1);
    }
    pos.needsUpdate = true;
    // Finale convergence: field brightens as the story resolves.
    (ref.current.material as THREE.PointsMaterial).opacity = 0.5 + phase(p, 0.8, 1) * 0.35;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#0284c7" transparent opacity={0.5} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/**
 * Movement I — THE SIGNAL. A macro glass comment orb with a molten core.
 * Dolly target of Act 1; rises and dissolves as the engine arrives.
 */
export function GlassSignal({ glass }: GlassOpts) {
  const orb = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!orb.current) return;
    const p = getScrollProgress();
    const enter = phase(p, 0, 0.06);
    const exit = phase(p, 0.3, 0.38);
    const k = enter * (1 - exit);
    orb.current.position.set(
      THREE.MathUtils.lerp(3.2, 1.3, enter),
      0.1 + breathe(state.clock.elapsedTime, 0.4, 0.05) + exit * 2.5,
      0
    );
    orb.current.rotation.y = p * 2.2;
    orb.current.rotation.x = 0.15 + p * 0.5;
    orb.current.scale.setScalar(Math.max(0.0001, k));
    if (core.current) {
      const mat = core.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.6 + Math.sin(p * 25) * 0.5; // signal pulse, scroll-driven
      core.current.rotation.y = -p * 3.5;
    }
  });
  return (
    <group ref={orb} scale={0.0001}>
      <mesh castShadow>
        <sphereGeometry args={[0.9, 64, 64]} />
        <meshPhysicalMaterial {...glassProps(glass, "#e0f2fe", 1.4)} />
      </mesh>
      <mesh ref={core} scale={0.34}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#38bdf8" emissiveIntensity={1.6} roughness={0.3} metalness={0.6} />
      </mesh>
      {/* orbit spark */}
      <mesh>
        <torusGeometry args={[1.25, 0.015, 8, 128]} />
        <meshBasicMaterial color="#7dd3fc" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

/**
 * Movement II — THE ENGINE. A chrome torus-knot core with three glass
 * satellites (Postgres / queue+worker / webhooks) on staggered orbits.
 * Assembles mid-orbit, dissolves before the dive.
 */
export function EngineCore({ glass }: GlassOpts) {
  const core = useRef<THREE.Mesh>(null);
  const sats = [useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  const trails = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];
  const rig = useRef<THREE.Group>(null);
  const satColors = ["#38bdf8", "#fbbf24", "#34d399"];

  useFrame((state) => {
    const p = getScrollProgress();
    const clock = state.clock.elapsedTime;
    const enter = phase(p, 0.24, 0.36);
    const exit = phase(p, 0.55, 0.62);
    const k = enter * (1 - exit);
    if (rig.current) {
      rig.current.position.set(-0.5, breathe(clock, 1, 0.04), 0);
      rig.current.scale.setScalar(Math.max(0.0001, k));
    }
    if (core.current) {
      // Scroll-cranked spin: scrubbing visibly winds/unwinds the machine.
      core.current.rotation.set(p * 2.2, p * 9, p * 1.1);
    }
    sats.forEach((s, i) => {
      const g = s.current;
      if (!g) return;
      const angle = p * (5 + i * 1.3) + (i * Math.PI * 2) / 3;
      const radius = 1.55;
      const tilt = [-0.5, 0.35, 1.1][i];
      g.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * Math.sin(tilt) * radius + breathe(clock, i * 3, 0.03),
        Math.sin(angle) * Math.cos(tilt) * radius
      );
    });
    trails.forEach((t, i) => {
      if (!t.current) return;
      t.current.rotation.x = Math.PI / 2 + [-0.5, 0.35, 1.1][i] * 0.4;
      (t.current.material as THREE.MeshBasicMaterial).opacity = 0.28 * k;
    });
  });

  return (
    <group ref={rig} scale={0.0001}>
      <mesh ref={core} castShadow>
        <torusKnotGeometry args={[0.55, 0.18, 220, 36]} />
        <meshStandardMaterial color="#e2e8f0" metalness={1} roughness={0.12} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.95, 0.02, 12, 128]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.8} />
      </mesh>
      {sats.map((s, i) => (
        <group key={i} ref={s}>
          <mesh castShadow>
            <sphereGeometry args={[0.16, 32, 32]} />
            <meshPhysicalMaterial {...glassProps(glass, "#f8fafc", 0.6)} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color={satColors[i]} />
          </mesh>
        </group>
      ))}
      {trails.map((t, i) => (
        <mesh key={`t${i}`} ref={t} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.55, 0.006, 8, 128]} />
          <meshBasicMaterial color={satColors[i]} transparent opacity={0} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Movement III — DELIVERY. A tracking shot through three chrome-framed
 * glass DM cards flying past the camera, staggered, then clearing the lane.
 */
export function DMCorridor({ glass }: GlassOpts) {
  const cards = [useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  const frames = ["#38bdf8", "#34d399", "#f59e0b"];

  useFrame((state) => {
    const p = getScrollProgress();
    const clock = state.clock.elapsedTime;
    cards.forEach((c, i) => {
      const g = c.current;
      if (!g) return;
      const at = 0.56 + i * 0.055;
      const fly = phase(p, at, at + 0.13);
      const clear = phase(p, 0.8, 0.86);
      // Deep → past camera → settle aside; lateral fan per card.
      const z = THREE.MathUtils.lerp(-3.2, 2.4, fly);
      g.position.set(0.6 + (i - 1) * 0.9 * fly + breathe(clock, i, 0.02), -0.15 + (i - 1) * 0.35 * fly, z);
      g.rotation.set(-0.08 * fly + i * 0.03, (i - 1) * 0.28 * fly + p * 0.3, (i - 1) * 0.06);
      g.scale.setScalar(Math.max(0.0001, fly * (1 - clear)));
    });
  });

  return (
    <group>
      {cards.map((c, i) => (
        <group key={i} ref={c} scale={0.0001}>
          <RoundedBox args={[1.5, 2.0, 0.06]} radius={0.09} smoothness={4} castShadow>
            <meshPhysicalMaterial {...glassProps(glass, "#f1f5f9", 0.8)} />
          </RoundedBox>
          {/* chrome frame: top + bottom rails */}
          {[-0.94, 0.94].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <boxGeometry args={[1.5, 0.05, 0.07]} />
              <meshStandardMaterial color={frames[i]} metalness={1} roughness={0.2} emissive={frames[i]} emissiveIntensity={0.4} />
            </mesh>
          ))}
          {/* message lines */}
          {[0.5, 0.28, 0.06, -0.5].map((y, j) => (
            <mesh key={j} position={j === 3 ? [0, y, 0.045] : [-0.15, y, 0.045]}>
              <boxGeometry args={[j === 3 ? 1.1 : j === 0 ? 0.9 : 1.2, 0.07, 0.01]} />
              <meshBasicMaterial color={j === 3 ? frames[i] : "#cbd5e1"} transparent opacity={0.9} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/**
 * Movement IV — OWNERSHIP. An emerald crystal rises from a black-mirror
 * disc as the camera settles wide; halo winds up with scroll.
 */
export function CrystalFinale({ glass }: GlassOpts) {
  const crystal = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const disc = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const p = getScrollProgress();
    const clock = state.clock.elapsedTime;
    const rise = phase(p, 0.84, 0.94);
    if (crystal.current) {
      crystal.current.position.set(0, THREE.MathUtils.lerp(-1.2, 0.9, rise) + breathe(clock, 2, 0.05), 0);
      crystal.current.rotation.set(p * 1.5, p * 5 + rise * 0.8, 0.2);
      crystal.current.scale.setScalar(Math.max(0.0001, rise));
    }
    if (halo.current) {
      halo.current.position.set(0, 0.9 + breathe(clock, 2, 0.05), 0);
      halo.current.rotation.x = Math.PI / 2.3;
      halo.current.rotation.z = p * 7;
      halo.current.scale.setScalar(Math.max(0.0001, rise));
    }
    if (disc.current) {
      disc.current.scale.setScalar(Math.max(0.0001, phase(p, 0.82, 0.9)));
      (disc.current.material as THREE.MeshStandardMaterial).opacity = phase(p, 0.82, 0.9) * 0.95;
    }
  });
  return (
    <group>
      <mesh ref={disc} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.25, 0]} scale={0.0001}>
        <cylinderGeometry args={[2.2, 2.2, 0.06, 72]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.3} transparent opacity={0} />
      </mesh>
      <mesh ref={crystal} scale={0.0001} castShadow>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshPhysicalMaterial
          {...(glass
            ? { color: "#10b981", emissive: "#059669", emissiveIntensity: 0.5, roughness: 0.05, metalness: 0.1, transmission: 0.85, thickness: 1.2, ior: 1.6, clearcoat: 1 }
            : { color: "#10b981", emissive: "#059669", emissiveIntensity: 0.7, roughness: 0.2, metalness: 0.4 })}
        />
      </mesh>
      <mesh ref={halo} scale={0.0001}>
        <torusGeometry args={[1.35, 0.045, 16, 128]} />
        <meshStandardMaterial color="#e2e8f0" metalness={1} roughness={0.15} emissive="#38bdf8" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}
