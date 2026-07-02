import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { TextureLoader } from "three";
import { planets, type Planet } from "../../lib/planets";
import sunTexture from "../../assets/sun.jpg";

type Props = {
  /** Slug currently being focused on (during fly-to). null = overview. */
  focusSlug: string | null;
  /** Fired when a planet receives a click. */
  onPlanetClick: (slug: string) => void;
  /** Fired when fly-to completes (caller should navigate). */
  onFocusComplete: (slug: string) => void;
  /** Fired when the camera/cursor hovers a planet (slug or null). */
  onPlanetHover?: (slug: string | null) => void;
  /** When true, fills the parent container instead of the viewport. */
  contained?: boolean;
};

/**
 * Cinematic Solar System overview. All planets render together on slow
 * orbits around the sun, with the camera drifting through space. Clicking
 * a planet triggers a fly-to: the camera glides in, other planets fade,
 * and the caller is notified to navigate.
 */
export function SolarSystemStage({ contained, ...props }: Props) {
  return (
    <div className={contained ? "absolute inset-0" : "fixed inset-0 z-0"}>
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ fov: 38, near: 0.1, far: 400, position: [0, 9, 28] }}
      >
        <Suspense fallback={null}>
          <Scene {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}


// Visual layout — compressed, NOT to scale. Tuned for beauty.
const ORBIT_BASE = 5.5;
const ORBIT_STEP = 3.4;
const PLANET_SIZES: Record<string, number> = {
  mercury: 0.35,
  venus: 0.55,
  earth: 0.6,
  mars: 0.45,
  jupiter: 1.35,
  saturn: 1.15,
  uranus: 0.85,
  neptune: 0.8,
};

type PlanetTextureSet = {
  map: THREE.Texture;
  normalMap?: THREE.Texture;
  cloudMap?: THREE.Texture;
  ringMap?: THREE.Texture;
  dispose: () => void;
};

type TexturePreset = {
  color: string[];
  normal?: string[];
  clouds?: string[];
  rings?: string[];
};

const LOCAL_TEXTURE_ROOT = "/textures/planets";

const localCandidates = (slug: string, kind: "color" | "normal" | "clouds" | "rings") => [
  `${LOCAL_TEXTURE_ROOT}/${slug}_${kind}.jpg`,
  `${LOCAL_TEXTURE_ROOT}/${slug}_${kind}.webp`,
  `${LOCAL_TEXTURE_ROOT}/${slug}_${kind}.png`,
];

const PLANET_TEXTURE_PRESETS: Record<string, TexturePreset> = {
  mercury: {
    color: [
      ...localCandidates("mercury", "color"),
      "https://www.solarsystemscope.com/textures/download/2k_mercury.jpg",
    ],
  },
  venus: {
    color: [
      ...localCandidates("venus", "color"),
      "https://www.solarsystemscope.com/textures/download/2k_venus_surface.jpg",
    ],
  },
  earth: {
    color: [
      ...localCandidates("earth", "color"),
      "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg",
      "https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg",
    ],
    normal: [
      ...localCandidates("earth", "normal"),
      "https://threejs.org/examples/textures/planets/earth_normal_2048.jpg",
    ],
    clouds: [
      ...localCandidates("earth", "clouds"),
      "https://www.solarsystemscope.com/textures/download/2k_earth_clouds.jpg",
    ],
  },
  mars: {
    color: [
      ...localCandidates("mars", "color"),
      "https://threejs.org/examples/textures/planets/mars_1k_color.jpg",
      "https://www.solarsystemscope.com/textures/download/2k_mars.jpg",
    ],
    normal: [
      ...localCandidates("mars", "normal"),
      "https://threejs.org/examples/textures/planets/mars_1k_normal.jpg",
    ],
  },
  jupiter: {
    color: [
      ...localCandidates("jupiter", "color"),
      "https://threejs.org/examples/textures/planets/jupiter2_1024.jpg",
      "https://www.solarsystemscope.com/textures/download/2k_jupiter.jpg",
    ],
  },
  saturn: {
    color: [
      ...localCandidates("saturn", "color"),
      "https://www.solarsystemscope.com/textures/download/2k_saturn.jpg",
    ],
    rings: [
      ...localCandidates("saturn", "rings"),
      "https://threejs.org/examples/textures/planets/saturnringcolor.jpg",
      "https://www.solarsystemscope.com/textures/download/2k_saturn_ring_alpha.png",
    ],
  },
  uranus: {
    color: [
      ...localCandidates("uranus", "color"),
      "https://www.solarsystemscope.com/textures/download/2k_uranus.jpg",
    ],
  },
  neptune: {
    color: [
      ...localCandidates("neptune", "color"),
      "https://www.solarsystemscope.com/textures/download/2k_neptune.jpg",
    ],
  },
};

const PLANET_COLORS: Record<string, [string, string, string]> = {
  mercury: ["#a7a19a", "#64615d", "#beb7aa"],
  venus: ["#eebd73", "#b86f32", "#f5d08c"],
  earth: ["#1b74b6", "#143d78", "#67a862"],
  mars: ["#d57543", "#8f3826", "#e4a06d"],
  jupiter: ["#e1c194", "#9c603f", "#f2dec0"],
  saturn: ["#edd6a2", "#b48951", "#fff0c9"],
  uranus: ["#b6fff8", "#5fc9d0", "#e4fffc"],
  neptune: ["#4d8cff", "#183a8f", "#75a7ff"],
};

// Sort planets by distance from the sun for orbit placement.
const ORBIT_ORDER = [
  "mercury",
  "venus",
  "earth",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
];

function orbitFor(slug: string): { radius: number; speed: number; phase: number } {
  const i = ORBIT_ORDER.indexOf(slug);
  const radius = ORBIT_BASE + i * ORBIT_STEP;
  // outer planets orbit slower (Kepler-flavoured, not real)
  const speed = 0.08 / Math.pow(1 + i * 0.4, 0.7);
  const phase = (i * 137.5 * Math.PI) / 180; // golden-angle spacing
  return { radius, speed, phase };
}

function configureTexture(texture: THREE.Texture, linear = false) {
  texture.colorSpace = linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

function loadFirstTexture(urls: string[], linear = false) {
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");

  return new Promise<THREE.Texture | undefined>((resolve) => {
    const tryLoad = (index: number) => {
      const url = urls[index];
      if (!url) {
        resolve(undefined);
        return;
      }

      loader.load(
        url,
        (texture) => resolve(configureTexture(texture, linear)),
        undefined,
        () => tryLoad(index + 1)
      );
    };

    tryLoad(0);
  });
}

function noise(x: number, y: number, seed: number) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 31.415) * 43758.5453;
  return n - Math.floor(n);
}

function createFallbackPlanetTexture(slug: string) {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  const [top, mid, bottom] = PLANET_COLORS[slug] ?? PLANET_COLORS.earth;
  const seed = slug.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, top);
  grad.addColorStop(0.5, mid);
  grad.addColorStop(1, bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  if (["jupiter", "saturn", "uranus", "neptune", "venus"].includes(slug)) {
    for (let y = 0; y < height; y += 1) {
      const wave = Math.sin((y / height) * Math.PI * (slug === "jupiter" ? 28 : 14) + seed) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255, 245, 220, ${0.07 + wave * 0.13})`;
      ctx.fillRect(0, y, width, 1);
    }
  }

  if (slug === "earth") {
    ctx.fillStyle = "rgba(54, 130, 70, 0.82)";
    for (let i = 0; i < 18; i += 1) {
      const cx = noise(i, 1, seed) * width;
      const cy = noise(i, 2, seed) * height;
      const rx = 26 + noise(i, 3, seed) * 70;
      const ry = 18 + noise(i, 4, seed) * 46;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, noise(i, 5, seed) * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (["mercury", "mars"].includes(slug)) {
    for (let i = 0; i < 110; i += 1) {
      const x = noise(i, 6, seed) * width;
      const y = noise(i, 7, seed) * height;
      const r = 2 + noise(i, 8, seed) * 15;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(20, 10, 10, 0.18)";
      ctx.lineWidth = Math.max(1, r * 0.12);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  return configureTexture(texture);
}

function createFallbackRingTexture() {
  const width = 1024;
  const height = 32;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.24, "rgba(189, 145, 88, 0.24)");
  grad.addColorStop(0.42, "rgba(240, 217, 165, 0.86)");
  grad.addColorStop(0.56, "rgba(96, 70, 44, 0.28)");
  grad.addColorStop(0.76, "rgba(226, 192, 125, 0.62)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  return configureTexture(texture);
}

function usePlanetTextureSet(slug: string) {
  const fallbackMap = useMemo(() => createFallbackPlanetTexture(slug), [slug]);
  const fallbackRingMap = useMemo(() => (slug === "saturn" ? createFallbackRingTexture() : undefined), [slug]);
  const [textureSet, setTextureSet] = useState<PlanetTextureSet | null>(null);

  useEffect(() => {
    let active = true;
    const preset = PLANET_TEXTURE_PRESETS[slug];
    setTextureSet(null);

    if (!preset) return undefined;

    Promise.all([
      loadFirstTexture(preset.color),
      preset.normal ? loadFirstTexture(preset.normal, true) : Promise.resolve(undefined),
      preset.clouds ? loadFirstTexture(preset.clouds) : Promise.resolve(undefined),
      preset.rings ? loadFirstTexture(preset.rings) : Promise.resolve(undefined),
    ]).then(([map, normalMap, cloudMap, ringMap]) => {
      if (!active) {
        map?.dispose();
        normalMap?.dispose();
        cloudMap?.dispose();
        ringMap?.dispose();
        return;
      }

      if (!map) return;

      setTextureSet({
        map,
        normalMap,
        cloudMap,
        ringMap,
        dispose: () => {
          map.dispose();
          normalMap?.dispose();
          cloudMap?.dispose();
          ringMap?.dispose();
        },
      });
    });

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => () => {
    fallbackMap?.dispose();
    fallbackRingMap?.dispose();
  }, [fallbackMap, fallbackRingMap]);

  useEffect(() => () => textureSet?.dispose(), [textureSet]);

  return {
    map: textureSet?.map || fallbackMap,
    normalMap: textureSet?.normalMap,
    cloudMap: textureSet?.cloudMap,
    ringMap: textureSet?.ringMap || fallbackRingMap,
    isFallback: !textureSet,
  };
}

function Scene({ focusSlug, onPlanetClick, onFocusComplete, onPlanetHover }: Props) {
  return (
    <>
      <ambientLight intensity={0.18} color={"#8aa0ff"} />
      {/* Sun acts as the key light */}
      <pointLight position={[0, 0, 0]} intensity={120} distance={120} decay={1.6} color={"#ffd9a0"} />
      <directionalLight position={[4, 6, 8]} intensity={0.25} color={"#cfd8ff"} />

      <Sun />
      <Orbits />

      <PlanetSystem
        focusSlug={focusSlug}
        onPlanetClick={onPlanetClick}
        onFocusComplete={onFocusComplete}
        onPlanetHover={onPlanetHover}
      />

      <CameraRig focusSlug={focusSlug} />
    </>
  );
}

function Sun() {
  const ref = useRef<THREE.Mesh | null>(null);
  const coronaInner = useRef<THREE.Mesh | null>(null);
  const coronaOuter = useRef<THREE.Mesh | null>(null);
  const tex = useLoader(TextureLoader, sunTexture) as THREE.Texture;
  useEffect(() => {
    if (tex) {
      tex.colorSpace = THREE.SRGBColorSpace;
      // @ts-ignore: three.Texture may not expose anisotropy on all builds
      (tex as any).anisotropy = 8;
      tex.wrapS = THREE.RepeatWrapping;
    }
  }, [tex]);

    useFrame((state, dt) => {
      if (ref.current) {
        ref.current.rotation.y += dt * 0.025;
        // subtle plasma "breathing" via UV offset
        const t = state.clock.elapsedTime;
        const mat = ref.current.material as THREE.MeshBasicMaterial | undefined;
        if (mat && mat.map) mat.map.offset.x = (t * 0.005) % 1;
      }
      if (coronaInner.current) {
        const s = 1 + Math.sin(state.clock.elapsedTime * 0.6) * 0.015;
        coronaInner.current.scale.setScalar(s);
      }
      if (coronaOuter.current) {
        const s = 1 + Math.sin(state.clock.elapsedTime * 0.35 + 1.2) * 0.025;
        coronaOuter.current.scale.setScalar(s);
      }
    });

  return (
    <group>
      {/* Photosphere — textured, emissive-like via basic material so it always glows */}
      <mesh ref={ref}>
        <sphereGeometry args={[1.5, 96, 96]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>

      {/* Chromosphere — thin warm halo hugging the surface */}
      <mesh>
        <sphereGeometry args={[1.62, 48, 48]} />
        <meshBasicMaterial
          color={"#ffb060"}
          transparent
          opacity={0.35}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Inner corona */}
      <mesh ref={coronaInner}>
        <sphereGeometry args={[2.4, 48, 48]} />
        <meshBasicMaterial
          color={"#ffa040"}
          transparent
          opacity={0.22}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer corona — soft falloff */}
      <mesh ref={coronaOuter}>
        <sphereGeometry args={[4.2, 48, 48]} />
        <meshBasicMaterial
          color={"#ff7020"}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Far bloom — wide warm wash that fakes lens bloom */}
      <mesh>
        <sphereGeometry args={[7.5, 32, 32]} />
        <meshBasicMaterial
          color={"#ff5010"}
          transparent
          opacity={0.05}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* (Removed: bare billboard sprite was rendering as a square white card.) */}

    </group>
  );
}

function Orbits() {
  const lines = useMemo(() => {
    return ORBIT_ORDER.map((slug) => {
      const { radius } = orbitFor(slug);
      const segments = 192;
      const pts = new Float32Array((segments + 1) * 3);
      for (let i = 0; i <= segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        pts[i * 3] = Math.cos(a) * radius;
        pts[i * 3 + 1] = 0;
        pts[i * 3 + 2] = Math.sin(a) * radius;
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.BufferAttribute(pts, 3));
      return { slug, geom };
    });
  }, []);
  return (
    <group>
      {lines.map(({ slug, geom }) => (
        <line key={slug}>
          <primitive object={geom} attach="geometry" />
          <lineBasicMaterial color={"#6080c0"} transparent opacity={0.08} />
        </line>
      ))}
    </group>
  );
}

  function PlanetSystem({
    focusSlug,
    onPlanetClick,
    onFocusComplete,
    onPlanetHover,
  }: {
    focusSlug: string | null;
    onPlanetClick: (slug: string) => void;
    onFocusComplete: (slug: string) => void;
    onPlanetHover?: (slug: string | null) => void;
  }) {
  // Track per-planet world position so the camera can fly toward it.
    const positions = useRef<Record<string, THREE.Vector3>>({});
    const [opacities, setOpacities] = useState<Record<string, number>>({});
    const notifiedRef = useRef(false);

  useEffect(() => {
    if (!focusSlug) {
      notifiedRef.current = false;
      return;
    }
    // fade non-focused planets out, then notify caller after travel
    const fade = setInterval(() => {
      setOpacities((prev) => {
        const next: Record<string, number> = { ...prev };
        let done = true;
        for (const p of planets) {
          const target = p.slug === focusSlug ? 1 : 0;
          const cur = next[p.slug] ?? 1;
          const v = cur + (target - cur) * 0.18;
          next[p.slug] = v;
          if (Math.abs(v - target) > 0.02) done = false;
        }
        if (done) clearInterval(fade);
        return next;
      });
    }, 32);
    const arrive = setTimeout(() => {
      if (!notifiedRef.current) {
        notifiedRef.current = true;
        onFocusComplete(focusSlug);
      }
    }, 1400);
    return () => {
      clearInterval(fade);
      clearTimeout(arrive);
    };
  }, [focusSlug, onFocusComplete]);

  return (
    <group>
      {planets.map((planet) => {
        return (
          <OrbitingPlanet
            key={planet.slug}
            planet={planet}
            opacity={opacities[planet.slug] ?? 1}
            paused={focusSlug !== null}
            onPositionUpdate={(v) => {
              positions.current[planet.slug] = v;
            }}
            onClick={() => onPlanetClick(planet.slug)}
            onHover={(h) => onPlanetHover?.(h ? planet.slug : null)}
          />
        );
      })}
    </group>
  );
}

  function OrbitingPlanet({
    planet,
    opacity,
    paused,
    onPositionUpdate,
    onClick,
    onHover,
  }: {
    planet: Planet;
    opacity: number;
    paused: boolean;
    onPositionUpdate: (v: THREE.Vector3) => void;
    onClick: () => void;
    onHover: (h: boolean) => void;
  }) {
    const groupRef = useRef<THREE.Group | null>(null);
    const meshRef = useRef<THREE.Mesh | null>(null);
    const cloudRef = useRef<THREE.Mesh | null>(null);
    const matRef = useRef<THREE.MeshStandardMaterial | null>(null);
    const cloudMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
    const atmoRef = useRef<THREE.MeshBasicMaterial | null>(null);
    const ringRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const { map, normalMap, cloudMap, ringMap, isFallback } = usePlanetTextureSet(planet.slug);
  const orbit = useMemo(() => orbitFor(planet.slug), [planet.slug]);
  const size = PLANET_SIZES[planet.slug] ?? 0.6;
  const isSaturn = planet.slug === "saturn";
  const tiltRef = useRef(planet.slug === "uranus" ? 1.3 : 0.18);

  // Pre-compute starting angle from phase
  const angleRef = useRef(orbit.phase);

    useFrame((_, dt) => {
      if (!paused) angleRef.current += dt * orbit.speed;
      const a = angleRef.current;
      const x = Math.cos(a) * orbit.radius;
      const z = Math.sin(a) * orbit.radius;
      if (groupRef.current) {
        groupRef.current.position.set(x, 0, z);
        onPositionUpdate(groupRef.current.position);
      }
      if (meshRef.current) meshRef.current.rotation.y += dt * 0.22;
      if (cloudRef.current) cloudRef.current.rotation.y += dt * 0.27;
      if (matRef.current) {
        matRef.current.opacity = opacity;
        matRef.current.transparent = true;
      }
      if (cloudMatRef.current) cloudMatRef.current.opacity = opacity * 0.28;
      if (atmoRef.current) atmoRef.current.opacity = opacity * 0.22;
      if (ringRef.current) ringRef.current.opacity = opacity * 0.85;
    });

  return (
    <group ref={groupRef}>
      {/* atmosphere glow */}
      <mesh scale={[size * 1.9, size * 1.9, size * 1.9] as [number, number, number]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          ref={atmoRef}
          color={"#7d9bff"}
          transparent
          opacity={0}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh
        ref={meshRef}
        rotation={new THREE.Euler(0, 0, tiltRef.current)}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          onHover(false);
          document.body.style.cursor = "";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <sphereGeometry args={[size, 96, 96]} />
        <meshStandardMaterial
          ref={matRef}
          map={map}
          normalMap={normalMap}
          normalScale={normalMap ? new THREE.Vector2(0.36, 0.36) : undefined}
          bumpMap={!normalMap && isFallback ? map : undefined}
          bumpScale={!normalMap && isFallback ? 0.01 : 0}
          roughness={planet.slug === "earth" ? 0.72 : 0.9}
          metalness={0}
          transparent
        />
      </mesh>

      {cloudMap ? (
        <mesh ref={cloudRef} rotation={new THREE.Euler(0, 0, tiltRef.current)} scale={1.018}>
          <sphereGeometry args={[size, 96, 96]} />
          <meshStandardMaterial
            ref={cloudMatRef}
            map={cloudMap}
            transparent
            opacity={0.28}
            roughness={1}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ) : null}

      {isSaturn && ringMap && (
        <mesh rotation={new THREE.Euler(-Math.PI / 2 + 0.38, 0, 0)}>
          <ringGeometry args={[size * 1.45, size * 2.4, 144, 1]} />
          <meshBasicMaterial
            ref={ringRef}
            map={ringMap}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

function CameraRig({ focusSlug }: { focusSlug: string | null }) {
  const { camera } = useThree();
  const baseTarget = useRef(new THREE.Vector3(0, 0, 0));
  const targetPos = useRef(new THREE.Vector3(0, 9, 28));
  const focusedPlanet = useRef<{ slug: string; radius: number } | null>(null);
  const t0 = useRef(0);

  useEffect(() => {
    if (focusSlug) {
      const orbit = orbitFor(focusSlug);
      focusedPlanet.current = { slug: focusSlug, radius: orbit.radius };
      t0.current = performance.now();
    } else {
      focusedPlanet.current = null;
    }
  }, [focusSlug]);

  useFrame((state, dt) => {
    const time = state.clock.elapsedTime;
    if (!focusedPlanet.current) {
      // Gentle drift through space — slow orbital cinematic
      const driftX = Math.sin(time * 0.06) * 3;
      const driftY = 8.5 + Math.sin(time * 0.04) * 1.6;
      const driftZ = 28 + Math.cos(time * 0.05) * 2.5;
      targetPos.current.set(driftX, driftY, driftZ);
      baseTarget.current.set(Math.sin(time * 0.03) * 1.5, 0, 0);
    } else {
      // Fly toward the focused planet's orbit ring (use a point ahead of it)
      const orbitR = focusedPlanet.current.radius;
      const elapsed = (performance.now() - t0.current) / 1400;
      const e = Math.min(1, elapsed);
      // approach from above, settle near the orbit
      const distance = THREE.MathUtils.lerp(orbitR + 6, orbitR + 1.6, e);
      const height = THREE.MathUtils.lerp(8.5, 1.2, e);
      targetPos.current.set(distance * 0.55, height, distance * 0.8);
      baseTarget.current.set(orbitR * 0.35, 0, orbitR * 0.55);
    }
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.lerp(targetPos.current, Math.min(1, dt * 1.6));
    const look = new THREE.Vector3().copy(baseTarget.current);
    cam.lookAt(look);
  });

  return null;
}
