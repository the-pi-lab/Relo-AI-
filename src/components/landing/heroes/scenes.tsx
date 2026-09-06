import { useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { dampCamera } from "./heroCam";

type P = RefObject<number>;

const lookTarget = new THREE.Vector3();

/** FEATURES — chrome core with six orbiting glass feature cards. */
export function OrbitScene({ p }: { p: P }) {
  const rig = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const cards = useMemo(() => [0, 1, 2, 3, 4, 5], []);
  const tints = ["#38bdf8", "#34d399", "#f59e0b", "#0ea5e9", "#10b981", "#fbbf24"];

  useFrame((state, delta) => {
    const v = p.current ?? 0;
    dampCamera(camera, { x: Math.sin(v * 1.2) * 1.6, y: 0.4 + v * 0.8, z: 6.6 - v * 1.4 }, lookTarget.set(0, 0, 0), delta);
    if (rig.current) rig.current.rotation.y = v * 1.4;
    void state;
  });

  return (
    <group ref={rig}>
      <mesh castShadow>
        <icosahedronGeometry args={[0.7, 1]} />
        <meshStandardMaterial color="#e2e8f0" metalness={1} roughness={0.12} />
      </mesh>
      <OrbitCards p={p} cards={cards} tints={tints} />
    </group>
  );
}

function OrbitCards({ p, cards, tints }: { p: P; cards: number[]; tints: string[] }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    const v = p.current ?? 0;
    cards.forEach((_, i) => {
      const g = refs.current[i];
      if (!g) return;
      const angle = (i / cards.length) * Math.PI * 2 + v * 2.6;
      g.position.set(Math.cos(angle) * 2.5, Math.sin(v * 3 + i) * 0.25, Math.sin(angle) * 2.5);
      g.lookAt(0, 0, 4);
      const s = 0.6 + 0.4 * Math.min(1, v * 3 + 0.4);
      g.scale.setScalar(s);
    });
  });
  return (
    <group>
      {cards.map((_, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el; }}>
          <RoundedBox args={[1.0, 1.3, 0.07]} radius={0.08} smoothness={3} castShadow>
            <meshPhysicalMaterial color="#f1f5f9" roughness={0.08} metalness={0.1} transmission={0.7} thickness={0.5} clearcoat={1} />
          </RoundedBox>
          <mesh position={[0, 0.3, 0.045]}>
            <boxGeometry args={[0.7, 0.09, 0.01]} />
            <meshBasicMaterial color={tints[i]} />
          </mesh>
          <mesh position={[-0.1, 0.05, 0.045]}>
            <boxGeometry args={[0.6, 0.06, 0.01]} />
            <meshBasicMaterial color="#cbd5e1" />
          </mesh>
          <mesh position={[-0.1, -0.14, 0.045]}>
            <boxGeometry args={[0.6, 0.06, 0.01]} />
            <meshBasicMaterial color="#cbd5e1" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** CALCULATOR — subscription pillar vs $10 pillar + rising gold coins. */
export function BarsScene({ p }: { p: P }) {
  const many = useRef<THREE.Mesh>(null);
  const ours = useRef<THREE.Mesh>(null);
  const coins = useRef<THREE.InstancedMesh>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const COUNT = 42;

  useFrame((state, delta) => {
    const v = p.current ?? 0;
    dampCamera(camera, { x: -3 + v * 5.2, y: 1.2, z: 6.4 }, lookTarget.set(0.4, 0.9, 0), delta);
    if (many.current) {
      const h = Math.max(0.02, v * 3.1);
      many.current.scale.y = h;
      many.current.position.y = h / 2;
    }
    if (ours.current) {
      const h = Math.max(0.02, 0.35 + v * 0.15);
      ours.current.scale.y = h;
      ours.current.position.y = h / 2;
      ours.current.rotation.y = v * 1.2;
    }
    const inst = coins.current;
    if (inst) {
      for (let i = 0; i < COUNT; i++) {
        const t = (v * 1.6 + i / COUNT) % 1;
        dummy.position.set(-1.1 + (i % 7) * 0.36, t * 3.4 - 0.4, -0.4 + Math.floor(i / 7) * 0.3);
        dummy.rotation.set(Math.PI / 2.4, 0, t * 6 + i);
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
      }
      inst.instanceMatrix.needsUpdate = true;
    }
    void state;
  });

  return (
    <group position={[0.4, -1.2, 0]}>
      <mesh position={[-1.1, 0, 0]}>
        <boxGeometry args={[2.6, 0.12, 1.4]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh ref={many} position={[-1.1, 0, -0.2]}>
        <boxGeometry args={[0.8, 1, 0.8]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh ref={ours} position={[1.1, 0, 0.1]}>
        <cylinderGeometry args={[0.42, 0.42, 1, 48]} />
        <meshStandardMaterial color="#10b981" metalness={0.85} roughness={0.2} emissive="#059669" emissiveIntensity={0.35} />
      </mesh>
      <instancedMesh ref={coins} args={[undefined, undefined, COUNT]}>
        <cylinderGeometry args={[0.11, 0.11, 0.03, 24]} />
        <meshStandardMaterial color="#fbbf24" metalness={1} roughness={0.25} />
      </instancedMesh>
    </group>
  );
}

/** BACKENDS — three glass discs descending into a stack on a chrome rod. */
export function StackScene({ p }: { p: P }) {
  const discs = [useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  const rod = useRef<THREE.Mesh>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const edges = ["#38bdf8", "#f59e0b", "#34d399"];

  useFrame((state, delta) => {
    const v = p.current ?? 0;
    const ang = v * Math.PI * 0.5;
    dampCamera(
      camera,
      { x: Math.sin(ang) * 5.6, y: 0.6 + v * 0.9, z: Math.cos(ang) * 5.6 },
      lookTarget.set(0, 0.2, 0),
      delta
    );
    discs.forEach((d, i) => {
      const g = d.current;
      if (!g) return;
      const land = Math.min(1, Math.max(0, (v * 1.25 - i * 0.18) / 0.5));
      const e = land * land * (3 - 2 * land);
      g.position.y = THREE.MathUtils.lerp(3.4 + i * 0.7, 1.15 - i * 0.62, e);
      g.rotation.y = (1 - e) * 2 + v * 0.8;
    });
    if (rod.current) rod.current.scale.y = Math.max(0.02, v * 1.9);
    void state;
  });

  return (
    <group>
      <mesh ref={rod} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 1, 24]} />
        <meshStandardMaterial color="#e2e8f0" metalness={1} roughness={0.15} />
      </mesh>
      {discs.map((d, i) => (
        <group key={i} ref={d} position={[0, 3.4 + i * 0.7, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[1.3, 1.3, 0.12, 64]} />
            <meshPhysicalMaterial color="#f1f5f9" roughness={0.08} metalness={0.1} transmission={0.75} thickness={0.4} clearcoat={1} />
          </mesh>
          <mesh>
            <torusGeometry args={[1.3, 0.035, 12, 96]} />
            <meshStandardMaterial color={edges[i]} metalness={1} roughness={0.2} emissive={edges[i]} emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** COMPARE — two pillars duel while a chrome ring spins between them. */
export function DuelScene({ p }: { p: P }) {
  const tall = useRef<THREE.Mesh>(null);
  const small = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;

  useFrame((state, delta) => {
    const v = p.current ?? 0;
    dampCamera(
      camera,
      { x: Math.sin(v * 1.1) * 4.4, y: 0.9, z: 5.6 - v * 0.8 },
      lookTarget.set(0, 0.7, 0),
      delta
    );
    if (tall.current) {
      const h = Math.max(0.05, 0.4 + v * 2.9);
      tall.current.scale.y = h;
      tall.current.position.y = h / 2;
    }
    if (small.current) {
      const h = Math.max(0.05, 0.3 + v * 0.35);
      small.current.scale.y = h;
      small.current.position.y = h / 2;
      small.current.rotation.y = v * 2;
    }
    if (ring.current) {
      ring.current.rotation.y = v * 7;
      ring.current.rotation.x = 0.5 + v * 0.4;
      ring.current.position.y = 1.4 + Math.sin(state.clock.elapsedTime * 1.2) * 0.08;
    }
    void state;
  });

  return (
    <group position={[0, -1.1, 0]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[4.4, 0.12, 1.6]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh ref={tall} position={[-1.2, 0, 0]}>
        <boxGeometry args={[0.9, 1, 0.9]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.28} />
      </mesh>
      <mesh ref={small} position={[1.2, 0, 0]}>
        <cylinderGeometry args={[0.46, 0.46, 1, 48]} />
        <meshStandardMaterial color="#10b981" metalness={0.85} roughness={0.2} emissive="#059669" emissiveIntensity={0.4} />
      </mesh>
      <mesh ref={ring} position={[0, 1.4, 0]}>
        <torusGeometry args={[0.55, 0.09, 20, 64]} />
        <meshStandardMaterial color="#e2e8f0" metalness={1} roughness={0.12} />
      </mesh>
    </group>
  );
}
