import * as THREE from "three";

/** Frame-rate independent damped camera move for hero scenes. */
export function dampCamera(
  camera: THREE.PerspectiveCamera,
  target: { x: number; y: number; z: number },
  look: THREE.Vector3,
  delta: number
) {
  const k = 1 - Math.exp(-4 * delta);
  camera.position.x += (target.x - camera.position.x) * k;
  camera.position.y += (target.y - camera.position.y) * k;
  camera.position.z += (target.z - camera.position.z) * k;
  camera.lookAt(look);
}
