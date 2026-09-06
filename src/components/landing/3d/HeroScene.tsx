import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox, ContactShadows, Text } from "@react-three/drei";
import * as THREE from "three";

function CeramicPhone() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    // Smooth responsive gyro tilt
    const targetX = (state.pointer.x * Math.PI) / 7;
    const targetY = (-state.pointer.y * Math.PI) / 9;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX, 0.05);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetY, 0.05);
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* 3D Smartphone Body: Titanium & Ceramic White */}
      <RoundedBox args={[2.5, 4.8, 0.22]} radius={0.24} smoothness={4} castShadow>
        <meshPhysicalMaterial
          color="#f8fafc"
          roughness={0.15}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </RoundedBox>

      {/* Titanium Outer Frame Rim */}
      <RoundedBox args={[2.52, 4.82, 0.18]} radius={0.24} smoothness={4}>
        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.9}
          roughness={0.2}
        />
      </RoundedBox>

      {/* Screen: Pure Luminous Clean Glass */}
      <mesh position={[0, 0, 0.12]}>
        <planeGeometry args={[2.3, 4.55]} />
        <meshPhysicalMaterial
          color="#ffffff"
          roughness={0.05}
          transmission={0.4}
          thickness={0.5}
          ior={1.5}
        />
      </mesh>

      {/* Notch / Dynamic Island */}
      <RoundedBox args={[0.7, 0.16, 0.02]} radius={0.06} smoothness={2} position={[0, 2.05, 0.13]}>
        <meshBasicMaterial color="#475569" />
      </RoundedBox>

      {/* 3D Floating Item 1: Incoming Comment Card (Cyan / Emerald) */}
      <Float speed={2.5} rotationIntensity={0.25} floatIntensity={0.5} position={[-1.4, 1.4, 0.6]}>
        <group>
          <RoundedBox args={[2.1, 0.75, 0.1]} radius={0.1} smoothness={3}>
            <meshPhysicalMaterial
              color="#ffffff"
              roughness={0.1}
              metalness={0.05}
              clearcoat={1}
              transmission={0.2}
            />
          </RoundedBox>
          <mesh position={[-0.7, 0, 0.06]}>
            <circleGeometry args={[0.2, 32]} />
            <meshStandardMaterial color="#0284c7" />
          </mesh>
          <RoundedBox args={[1.0, 0.12, 0.02]} radius={0.04} smoothness={2} position={[0.15, 0.1, 0.06]}>
            <meshBasicMaterial color="#475569" />
          </RoundedBox>
          <RoundedBox args={[0.7, 0.08, 0.02]} radius={0.03} smoothness={2} position={[0, -0.1, 0.06]}>
            <meshBasicMaterial color="#0284c7" />
          </RoundedBox>
        </group>
      </Float>

      {/* 3D Floating Item 2: The Interactive 3-Button Card ("Custom Box") */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4} position={[1.5, -0.6, 0.8]}>
        <group>
          <RoundedBox args={[2.2, 1.5, 0.12]} radius={0.12} smoothness={3} castShadow>
            <meshPhysicalMaterial
              color="#ffffff"
              roughness={0.1}
              metalness={0.1}
              clearcoat={1}
            />
          </RoundedBox>
          {/* Card Banner */}
          <RoundedBox args={[1.95, 0.45, 0.02]} radius={0.06} smoothness={2} position={[0, 0.42, 0.07]}>
            <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.4} />
          </RoundedBox>
          {/* Button 1 (Cyan/Blue) */}
          <RoundedBox args={[1.9, 0.22, 0.03]} radius={0.05} smoothness={2} position={[0, 0.04, 0.07]}>
            <meshStandardMaterial color="#0284c7" />
          </RoundedBox>
          {/* Button 2 (Emerald) */}
          <RoundedBox args={[1.9, 0.22, 0.03]} radius={0.05} smoothness={2} position={[0, -0.26, 0.07]}>
            <meshStandardMaterial color="#059669" />
          </RoundedBox>
          {/* Button 3 (Slate) */}
          <RoundedBox args={[1.9, 0.22, 0.03]} radius={0.05} smoothness={2} position={[0, -0.56, 0.07]}>
            <meshStandardMaterial color="#334155" />
          </RoundedBox>
        </group>
      </Float>

      {/* 3D Floating Emerald Gem Sphere */}
      <Float speed={3} rotationIntensity={0.4} floatIntensity={0.7} position={[1.8, 1.8, -0.2]}>
        <mesh scale={0.4}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshPhysicalMaterial
            color="#10b981"
            roughness={0.1}
            metalness={0.2}
            clearcoat={1}
            transmission={0.3}
          />
        </mesh>
      </Float>

      {/* 3D Floating Cyan Glass Torus */}
      <Float speed={2.6} rotationIntensity={0.6} floatIntensity={0.6} position={[-1.9, -1.6, 0.2]}>
        <mesh scale={0.35} rotation={[0.5, 0.8, 0]}>
          <torusGeometry args={[1, 0.35, 24, 48]} />
          <meshPhysicalMaterial
            color="#0ea5e9"
            roughness={0.1}
            metalness={0.3}
            transmission={0.4}
          />
        </mesh>
      </Float>

      {/* 3D Floating Silver Ring */}
      <Float speed={1.8} rotationIntensity={0.5} floatIntensity={0.5} position={[2.2, 0.4, -0.5]}>
        <mesh scale={0.4} rotation={[1, 0.3, 0]}>
          <torusGeometry args={[1, 0.15, 16, 32]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
        </mesh>
      </Float>
    </group>
  );
}

export function HeroScene() {
  return (
    <div className="w-full h-full min-h-[460px] lg:min-h-[600px] relative pointer-events-auto">
      {/* Light Clean Ambient Halo (Pure Sky & Mint) */}
      <div className="absolute inset-0 bg-gradient-to-tr from-sky-400/20 via-emerald-400/15 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

      <Canvas
        camera={{ position: [0, 0, 6.4], fov: 44 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[6, 8, 5]} intensity={2.4} color="#ffffff" castShadow />
        <directionalLight position={[-5, -3, 3]} intensity={1.2} color="#bae6fd" />
        <pointLight position={[3, -2, 3]} intensity={1.8} color="#34d399" />
        <pointLight position={[-3, 4, 3]} intensity={2.0} color="#38bdf8" />

        <CeramicPhone />

        <ContactShadows
          position={[0, -2.7, 0]}
          opacity={0.35}
          scale={7.5}
          blur={2}
          far={4}
          color="#64748b"
        />
      </Canvas>
    </div>
  );
}
