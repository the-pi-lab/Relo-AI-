import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { sampleCamera, type CamSample } from "./timeline";
import { getScrollProgress } from "./scrollStore";

/**
 * LAYER 4 — Camera system.
 * Position/lookAt/fov are pure functions of scroll progress (scrub-safe);
 * a critically-damped lerp adds cinematic inertia, and pointer parallax
 * adds ±0.15 organic drift (disabled on touch / reduced motion).
 */
export function CameraRig({ allowParallax }: { allowParallax: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const look = useRef(new THREE.Vector3(0.9, 0, 0));
  const sample = useMemo<CamSample>(
    () => ({ pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 45 }),
    []
  );
  const mouse = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const p = getScrollProgress();
    sampleCamera(p, sample);

    if (allowParallax) {
      mouse.current.x = THREE.MathUtils.damp(mouse.current.x, state.pointer.x, 4, delta);
      mouse.current.y = THREE.MathUtils.damp(mouse.current.y, state.pointer.y, 4, delta);
    }

    const k = 1 - Math.exp(-5 * delta); // inertia (frame-rate independent)
    camera.position.x += (sample.pos.x + mouse.current.x * 0.15 - camera.position.x) * k;
    camera.position.y += (sample.pos.y + mouse.current.y * 0.1 - camera.position.y) * k;
    camera.position.z += (sample.pos.z - camera.position.z) * k;

    look.current.x += (sample.look.x - look.current.x) * k;
    look.current.y += (sample.look.y - look.current.y) * k;
    look.current.z += (sample.look.z - look.current.z) * k;
    camera.lookAt(look.current);

    const nextFov = camera.fov + (sample.fov - camera.fov) * k;
    if (Math.abs(nextFov - camera.fov) > 0.001) {
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
