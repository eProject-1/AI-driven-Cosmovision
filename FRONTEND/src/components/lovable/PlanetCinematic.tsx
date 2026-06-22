import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { TextureLoader } from "three";
import type { Planet } from "../../lib/planets";

/**
 * Cinematic single-planet stage for detail pages. The planet sits centered,
 * slowly rotating with realistic side-lit shading. The camera makes a very
 * slow orbital drift to keep the scene alive without distracting.
 */
export function PlanetCinematic({ planet }: { planet: Planet }) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ fov: 32, near: 0.1, far: 100, position: [2.2, 0.4, 4.6] }}
      >
        <Suspense fallback={null}>
          <Scene planet={planet} />
        </Suspense>
      </Canvas>
    </div>
  );
}

function Scene({ planet }: { planet: Planet }) {
  const texture = useLoader(TextureLoader, planet.image);
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
  }, [texture]);

  const isSaturn = planet.slug === "saturn";
  const tilt = planet.slug === "uranus" ? 1.3 : 0.2;
  const sphereRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const ringTexture = useMemo(() => {
    if (!isSaturn) return null;
    const size = 1024;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = 16;
    const ctx = c.getContext("2d")!;
    const grad = ctx.createLinearGradient(0, 0, size, 0);
    grad.addColorStop(0.0, "rgba(0,0,0,0)");
    grad.addColorStop(0.3, "rgba(220,190,140,0.5)");
    grad.addColorStop(0.5, "rgba(235,205,160,0.9)");
    grad.addColorStop(0.7, "rgba(180,150,110,0.55)");
    grad.addColorStop(1.0, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, 16);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [isSaturn]);

  useFrame((state, dt) => {
    if (sphereRef.current) sphereRef.current.rotation.y += dt * 0.05;
    if (ringRef.current) ringRef.current.rotation.z += dt * 0.005;
    // Very slow orbital drift
    const t = state.clock.elapsedTime;
    const cam = state.camera;
    const r = 4.8;
    const ang = Math.sin(t * 0.05) * 0.25;
    const tx = Math.sin(ang) * r;
    const tz = Math.cos(ang) * r;
    const ty = 0.4 + Math.sin(t * 0.07) * 0.2;
    cam.position.x += (tx - cam.position.x) * Math.min(1, dt * 0.6);
    cam.position.y += (ty - cam.position.y) * Math.min(1, dt * 0.6);
    cam.position.z += (tz - cam.position.z) * Math.min(1, dt * 0.6);
    cam.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.1} color={"#7a86ff"} />
      <directionalLight position={[6, 1.5, 4]} intensity={2.8} color={"#fff4e0"} />
      <directionalLight position={[-5, -1, -3]} intensity={0.2} color={"#5a78ff"} />

      {/* atmospheric glow */}
      <mesh scale={2.8}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={"#6b8cff"}
          transparent
          opacity={0.18}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={sphereRef} rotation={[0, 0, tilt]}>
        <sphereGeometry args={[1.15, 96, 96]} />
        <meshStandardMaterial map={texture} roughness={0.95} metalness={0} />
      </mesh>

      {isSaturn && ringTexture && (
        <mesh ref={ringRef} rotation={[-Math.PI / 2 + 0.45, 0, 0]}>
          <ringGeometry args={[1.55, 2.7, 128, 1]} />
          <meshBasicMaterial
            map={ringTexture}
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </>
  );
}
